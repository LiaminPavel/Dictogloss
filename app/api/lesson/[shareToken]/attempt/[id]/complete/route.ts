import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const paramsSchema = z.object({
  shareToken: z.string().min(1),
  id: z.string().min(1),
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

export async function PATCH(
  _request: Request,
  context: { params: { shareToken: string; id: string } },
): Promise<NextResponse> {
  const parsed = paramsSchema.safeParse(context.params);
  if (!parsed.success) {
    return errorResponse("Invalid route params.", "VALIDATION_ERROR", 400);
  }

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        shareToken: parsed.data.shareToken,
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
        id: parsed.data.id,
        lessonId: lesson.id,
      },
      select: {
        id: true,
      },
    });

    if (!attempt) {
      return errorResponse("Attempt not found.", "NOT_FOUND", 404);
    }

    const [correctCount, totalCount] = await Promise.all([
      prisma.studentAnswer.count({
        where: {
          attemptId: attempt.id,
          isCorrect: true,
        },
      }),
      prisma.sentence.count({
        where: {
          lessonId: lesson.id,
        },
      }),
    ]);

    await prisma.lessonAttempt.update({
      where: {
        id: attempt.id,
      },
      data: {
        completedAt: new Date(),
        totalScore: correctCount,
        totalCount,
      },
    });

    return NextResponse.json({
      data: {
        attemptId: attempt.id,
        totalScore: correctCount,
        totalCount,
      },
      error: null,
    });
  } catch {
    return errorResponse("Failed to complete attempt.", "COMPLETE_ATTEMPT_FAILED", 500);
  }
}
