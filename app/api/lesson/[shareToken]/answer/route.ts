import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const paramsSchema = z.object({
  shareToken: z.string().min(1),
});

const bodySchema = z.object({
  attemptId: z.string().min(1),
  sentenceId: z.string().min(1),
  studentText: z.string(),
});

type ApiErrorBody = {
  data: null;
  error: {
    message: string;
    code: string;
  };
};

function errorResponse(message: string, code: string, status: number): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    {
      data: null,
      error: { message, code },
    },
    { status },
  );
}

export async function POST(
  request: Request,
  context: { params: { shareToken: string } },
): Promise<NextResponse> {
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return errorResponse("Invalid lesson token.", "VALIDATION_ERROR", 400);
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", "INVALID_JSON", 400);
  }

  const parsedBody = bodySchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return errorResponse("Invalid answer payload.", "VALIDATION_ERROR", 400);
  }

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        shareToken: parsedParams.data.shareToken,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    const attempt = await prisma.lessonAttempt.findFirst({
      where: {
        id: parsedBody.data.attemptId,
        lessonId: lesson.id,
      },
      select: {
        id: true,
      },
    });

    if (!attempt) {
      return errorResponse("Attempt not found.", "NOT_FOUND", 404);
    }

    const sentence = await prisma.sentence.findFirst({
      where: {
        id: parsedBody.data.sentenceId,
        lessonId: lesson.id,
      },
      select: {
        id: true,
        text: true,
      },
    });

    if (!sentence) {
      return errorResponse("Sentence not found.", "NOT_FOUND", 404);
    }

    const normalizedStudent = parsedBody.data.studentText.trim();
    const normalizedCorrect = sentence.text.trim();
    const isCorrect = normalizedStudent === normalizedCorrect;

    const existingAnswer = await prisma.studentAnswer.findFirst({
      where: {
        attemptId: attempt.id,
        sentenceId: sentence.id,
      },
      select: {
        id: true,
        playCount: true,
      },
    });

    if (existingAnswer) {
      await prisma.studentAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          studentText: parsedBody.data.studentText,
          isCorrect,
          answeredAt: new Date(),
        },
      });
    } else {
      await prisma.studentAnswer.create({
        data: {
          attemptId: attempt.id,
          sentenceId: sentence.id,
          studentText: parsedBody.data.studentText,
          isCorrect,
        },
      });
    }

    return NextResponse.json({
      data: {
        isCorrect,
        correctText: isCorrect ? null : sentence.text,
      },
      error: null,
    });
  } catch {
    return errorResponse("Failed to submit answer.", "SUBMIT_ANSWER_FAILED", 500);
  }
}
