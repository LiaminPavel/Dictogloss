import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

type ApiErrorBody = {
  data: null;
  error: {
    message: string;
    code: string;
  };
};

const paramsSchema = z.object({
  shareToken: z.string().min(1),
});

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
  _request: Request,
  context: { params: { shareToken: string } },
): Promise<NextResponse> {
  const parsedParams = paramsSchema.safeParse(context.params);
  if (!parsedParams.success) {
    return errorResponse("Invalid lesson token.", "VALIDATION_ERROR", 400);
  }

  try {
    const lesson = await prisma.lesson.findFirst({
      where: {
        shareToken: parsedParams.data.shareToken,
        deletedAt: null,
        isActive: true,
      },
      select: {
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

    if (!lesson) {
      return errorResponse("Lesson not found.", "NOT_FOUND", 404);
    }

    return NextResponse.json({
      data: {
        title: lesson.title,
        voice: lesson.voice,
        accent: lesson.accent,
        sentenceCount: lesson._count.sentences,
      },
      error: null,
    });
  } catch {
    return errorResponse("Failed to fetch lesson.", "FETCH_LESSON_FAILED", 500);
  }
}
