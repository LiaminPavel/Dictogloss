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
        sentences: {
          orderBy: {
            order: "asc",
          },
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

    const attempts = await prisma.lessonAttempt.findMany({
      where: {
        lessonId: lesson.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      select: {
        id: true,
        studentName: true,
        startedAt: true,
        completedAt: true,
        totalScore: true,
        totalCount: true,
        answers: {
          select: {
            sentenceId: true,
            isCorrect: true,
          },
        },
      },
    });

    const sentenceStatsMap = new Map<
      string,
      {
        correctCount: number;
        totalAnswered: number;
      }
    >();

    for (const sentence of lesson.sentences) {
      sentenceStatsMap.set(sentence.id, { correctCount: 0, totalAnswered: 0 });
    }

    for (const attempt of attempts) {
      for (const answer of attempt.answers) {
        const bucket = sentenceStatsMap.get(answer.sentenceId);
        if (!bucket) {
          continue;
        }

        bucket.totalAnswered += 1;
        if (answer.isCorrect) {
          bucket.correctCount += 1;
        }
      }
    }

    return NextResponse.json({
      data: {
        lesson: {
          id: lesson.id,
          title: lesson.title,
        },
        attempts: attempts.map((attempt) => {
          const totalCount = attempt.totalCount ?? lesson.sentences.length;
          const totalScore = attempt.totalScore ?? attempt.answers.filter((answer) => answer.isCorrect).length;
          const accuracy = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0;

          return {
            id: attempt.id,
            studentName: attempt.studentName,
            startedAt: attempt.startedAt,
            completedAt: attempt.completedAt,
            totalScore,
            totalCount,
            accuracy,
          };
        }),
        sentenceAccuracy: lesson.sentences.map((sentence) => {
          const stats = sentenceStatsMap.get(sentence.id) ?? { correctCount: 0, totalAnswered: 0 };
          const accuracy = stats.totalAnswered > 0 ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0;

          return {
            sentenceId: sentence.id,
            order: sentence.order,
            text: sentence.text,
            correctCount: stats.correctCount,
            totalAnswered: stats.totalAnswered,
            accuracy,
          };
        }),
      },
      error: null,
    });
  } catch (error) {
    if (error instanceof Error && (error.message === "Unauthorized" || error.message === "Forbidden")) {
      const status = error.message === "Unauthorized" ? 401 : 403;
      const code = error.message === "Unauthorized" ? "UNAUTHORIZED" : "FORBIDDEN";
      return errorResponse(error.message, code, status);
    }

    return errorResponse("Failed to fetch lesson stats.", "FETCH_STATS_FAILED", 500);
  }
}
