import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";
import { extractStorageKeyFromAudioUrl, getPresignedAudioUrl } from "@/lib/storage/spaces";

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

const paramsSchema = z.object({
  id: z.string().min(1),
  sentenceId: z.string().min(1),
});

export async function GET(
  _request: Request,
  context: { params: { id: string; sentenceId: string } },
): Promise<NextResponse> {
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return errorResponse("Invalid route params.", "VALIDATION_ERROR", 400);
  }

  try {
    const admin = await requireAdmin();
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: parsedParams.data.id,
        userId: admin.id,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
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

    const key = extractStorageKeyFromAudioUrl(sentence.audioUrl);
    const presignedUrl = await getPresignedAudioUrl(key);

    return NextResponse.json({
      data: {
        audioUrl: presignedUrl,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to get preview audio URL.", "AUDIO_PREVIEW_FAILED", 500);
  }
}
