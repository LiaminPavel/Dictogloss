import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";

const createLessonSchema = z.object({
  title: z.string().trim().min(1),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
  accent: z.enum(["american", "british"]),
  sentences: z.array(z.string().trim().min(1)).min(1),
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
      error: {
        message,
        code,
      },
    },
    { status },
  );
}

export async function POST(request: Request): Promise<NextResponse> {
  let jsonBody: unknown;

  try {
    jsonBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", "INVALID_JSON", 400);
  }

  const parsedBody = createLessonSchema.safeParse(jsonBody);
  if (!parsedBody.success) {
    return errorResponse("Invalid lesson payload.", "VALIDATION_ERROR", 400);
  }

  try {
    const admin = await requireAdmin();
    const normalizedSentences = parsedBody.data.sentences.map((sentence) => sentence.trim());

    const lesson = await prisma.lesson.create({
      data: {
        title: parsedBody.data.title.trim(),
        userId: admin.id,
        voice: parsedBody.data.voice,
        accent: parsedBody.data.accent,
        sentences: {
          create: normalizedSentences.map((text, index) => ({
            order: index + 1,
            text,
          })),
        },
      },
      select: {
        id: true,
        shareToken: true,
        title: true,
        voice: true,
        accent: true,
        _count: {
          select: {
            sentences: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        data: {
          lessonId: lesson.id,
          shareToken: lesson.shareToken,
          title: lesson.title,
          voice: lesson.voice,
          accent: lesson.accent,
          sentenceCount: lesson._count.sentences,
        },
        error: null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to create lesson.", "CREATE_LESSON_FAILED", 500);
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const admin = await requireAdmin();

    const lessons = await prisma.lesson.findMany({
      where: {
        userId: admin.id,
        deletedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        shareToken: true,
        voice: true,
        accent: true,
        createdAt: true,
        _count: {
          select: {
            sentences: true,
            attempts: true,
          },
        },
        sentences: {
          select: {
            audioStatus: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: lessons.map((lesson) => {
        const readyCount = lesson.sentences.filter((sentence) => sentence.audioStatus === "READY").length;
        const failedCount = lesson.sentences.filter((sentence) => sentence.audioStatus === "FAILED").length;
        return {
          id: lesson.id,
          title: lesson.title,
          shareToken: lesson.shareToken,
          voice: lesson.voice,
          accent: lesson.accent,
          createdAt: lesson.createdAt,
          sentenceCount: lesson._count.sentences,
          attemptCount: lesson._count.attempts,
          audioReadyCount: readyCount,
          audioFailedCount: failedCount,
        };
      }),
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to fetch lessons.", "FETCH_LESSONS_FAILED", 500);
  }
}
