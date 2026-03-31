import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/utils";
import { generateSpeechMp3 } from "@/lib/audio/tts";
import { prisma } from "@/lib/db/prisma";
import { uploadAudioToSpaces } from "@/lib/storage/spaces";

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
      error: {
        message,
        code,
      },
    },
    { status },
  );
}

const paramsSchema = z.object({
  id: z.string().min(1),
  sentenceId: z.string().min(1),
});

export async function POST(
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
        voice: true,
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
        text: true,
        audioStatus: true,
      },
    });

    if (!sentence) {
      return errorResponse("Sentence not found.", "NOT_FOUND", 404);
    }

    if (sentence.audioStatus !== "FAILED") {
      return errorResponse("Only FAILED sentence can be regenerated.", "INVALID_STATUS", 400);
    }

    await prisma.sentence.update({
      where: { id: sentence.id },
      data: { audioStatus: "PROCESSING" },
    });

    try {
      const audioBuffer = await generateSpeechMp3(sentence.text, lesson.voice);
      const key = `audio/${lesson.id}/${sentence.id}.mp3`;
      const audioUrl = await uploadAudioToSpaces(key, audioBuffer);

      await prisma.sentence.update({
        where: { id: sentence.id },
        data: {
          audioStatus: "READY",
          audioUrl,
        },
      });
    } catch {
      await prisma.sentence.update({
        where: { id: sentence.id },
        data: {
          audioStatus: "FAILED",
        },
      });

      return errorResponse("Regeneration failed.", "REGENERATION_FAILED", 500);
    }

    return NextResponse.json({
      data: {
        sentenceId: sentence.id,
        status: "READY",
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to regenerate sentence.", "REGENERATION_FAILED", 500);
  }
}
