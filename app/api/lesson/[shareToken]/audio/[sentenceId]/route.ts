import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";
import { extractStorageKeyFromAudioUrl, getPresignedAudioUrl } from "@/lib/storage/spaces";

const paramsSchema = z.object({
  shareToken: z.string().min(1),
  sentenceId: z.string().min(1),
});

const querySchema = z.object({
  attemptId: z.string().min(1),
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

export async function GET(
  request: Request,
  context: { params: { shareToken: string; sentenceId: string } },
): Promise<NextResponse> {
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return errorResponse("Invalid route params.", "VALIDATION_ERROR", 400);
  }

  const url = new URL(request.url);
  const parsedQuery = querySchema.safeParse({
    attemptId: url.searchParams.get("attemptId"),
  });
  if (!parsedQuery.success) {
    return errorResponse("attemptId is required.", "VALIDATION_ERROR", 400);
  }

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        shareToken: parsedParams.data.shareToken,
        deletedAt: null,
        isActive: true,
      },
      select: { id: true },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    const attempt = await prisma.lessonAttempt.findFirst({
      where: {
        id: parsedQuery.data.attemptId,
        lessonId: lesson.id,
      },
      select: { id: true },
    });

    if (!attempt) {
      return errorResponse("Attempt not found.", "NOT_FOUND", 404);
    }

    const sentence = await prisma.sentence.findFirst({
      where: {
        id: parsedParams.data.sentenceId,
        lessonId: lesson.id,
      },
      select: {
        id: true,
        audioStatus: true,
        audioUrl: true,
      },
    });

    if (!sentence) {
      return errorResponse("Sentence not found.", "NOT_FOUND", 404);
    }

    if (sentence.audioStatus !== "READY" || !sentence.audioUrl) {
      return errorResponse("Audio is not ready.", "AUDIO_NOT_READY", 409);
    }

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

    if (existingAnswer && existingAnswer.playCount >= 3) {
      return errorResponse("Play limit reached.", "PLAY_LIMIT_REACHED", 429);
    }

    if (!existingAnswer) {
      await prisma.studentAnswer.create({
        data: {
          attemptId: attempt.id,
          sentenceId: sentence.id,
          studentText: "",
          isCorrect: false,
          playCount: 1,
        },
      });
    } else {
      await prisma.studentAnswer.update({
        where: {
          id: existingAnswer.id,
        },
        data: {
          playCount: existingAnswer.playCount + 1,
        },
      });
    }

    const refreshedAnswer = await prisma.studentAnswer.findFirst({
      where: {
        attemptId: attempt.id,
        sentenceId: sentence.id,
      },
      select: {
        playCount: true,
      },
    });

    const key = extractStorageKeyFromAudioUrl(sentence.audioUrl);
    const presignedUrl = await getPresignedAudioUrl(key);

    return NextResponse.json({
      data: {
        audioUrl: presignedUrl,
        playCount: refreshedAnswer?.playCount ?? 0,
        remainingPlays: Math.max(0, 3 - (refreshedAnswer?.playCount ?? 0)),
      },
      error: null,
    });
  } catch {
    return errorResponse("Failed to get audio URL.", "AUDIO_URL_FAILED", 500);
  }
}
