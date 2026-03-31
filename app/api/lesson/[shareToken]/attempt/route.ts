import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const paramsSchema = z.object({
  shareToken: z.string().min(1),
});

const bodySchema = z.object({
  studentName: z.string().trim().min(1).max(120),
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
    return errorResponse("Invalid attempt payload.", "VALIDATION_ERROR", 400);
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

    const attempt = await prisma.lessonAttempt.create({
      data: {
        lessonId: lesson.id,
        studentName: parsedBody.data.studentName.trim(),
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          attemptId: attempt.id,
        },
        error: null,
      },
      { status: 201 },
    );
  } catch {
    return errorResponse("Failed to create attempt.", "CREATE_ATTEMPT_FAILED", 500);
  }
}
