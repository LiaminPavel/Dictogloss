import { NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/utils";
import { prisma } from "@/lib/db/prisma";

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

export async function GET(
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
        title: true,
        shareToken: true,
        voice: true,
        accent: true,
        createdAt: true,
        _count: {
          select: {
            attempts: true,
            sentences: true,
          },
        },
        sentences: {
          orderBy: {
            order: "asc",
          },
          select: {
            id: true,
            order: true,
            text: true,
            audioStatus: true,
            audioUrl: true,
          },
        },
      },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    return NextResponse.json({
      data: {
        id: lesson.id,
        title: lesson.title,
        shareToken: lesson.shareToken,
        voice: lesson.voice,
        accent: lesson.accent,
        createdAt: lesson.createdAt,
        sentenceCount: lesson._count.sentences,
        attemptCount: lesson._count.attempts,
        sentences: lesson.sentences.map((sentence) => ({
          id: sentence.id,
          order: sentence.order,
          audioStatus: sentence.audioStatus,
          hasAudio: Boolean(sentence.audioUrl),
          textPreview: sentence.text,
        })),
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to fetch lesson details.", "FETCH_LESSON_FAILED", 500);
  }
}

export async function DELETE(
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
      select: { id: true },
    });

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    return NextResponse.json({
      data: {
        id: lesson.id,
        deleted: true,
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to delete lesson.", "DELETE_LESSON_FAILED", 500);
  }
}
