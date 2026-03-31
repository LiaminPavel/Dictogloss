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
});

export async function POST(
  _request: Request,
  context: { params: { id: string } },
): Promise<NextResponse> {
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return errorResponse("Invalid lesson id.", "VALIDATION_ERROR", 400);
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
        shareToken: true,
        voice: true,
        sentences: {
          where: {
            audioStatus: {
              in: ["PENDING", "FAILED"],
            },
          },
          orderBy: {
            order: "asc",
          },
          take: 1,
          select: {
            id: true,
            order: true,
            text: true,
          },
        },
      },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    const nextSentence = lesson.sentences[0];
    if (!nextSentence) {
      const total = await prisma.sentence.count({ where: { lessonId: lesson.id } });
      return NextResponse.json({
        data: {
          completed: total,
          total,
          done: true,
          shareUrl: `/lesson/${lesson.shareToken}`,
        },
        error: null,
      });
    }

    await prisma.sentence.update({
      where: { id: nextSentence.id },
      data: { audioStatus: "PROCESSING" },
    });

    try {
      const audioBuffer = await generateSpeechMp3(nextSentence.text, lesson.voice);
      const key = `audio/${lesson.id}/${nextSentence.id}.mp3`;
      const audioUrl = await uploadAudioToSpaces(key, audioBuffer);

      await prisma.sentence.update({
        where: { id: nextSentence.id },
        data: {
          audioStatus: "READY",
          audioUrl,
        },
      });
    } catch {
      await prisma.sentence.update({
        where: { id: nextSentence.id },
        data: { audioStatus: "FAILED" },
      });
    }

    const [total, readyCount] = await Promise.all([
      prisma.sentence.count({ where: { lessonId: lesson.id } }),
      prisma.sentence.count({ where: { lessonId: lesson.id, audioStatus: "READY" } }),
    ]);

    return NextResponse.json({
      data: {
        completed: readyCount,
        total,
        done: readyCount === total,
        currentOrder: nextSentence.order,
        shareUrl: `/lesson/${lesson.shareToken}`,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Audio generation failed.", "AUDIO_GENERATION_FAILED", 500);
  }
}
