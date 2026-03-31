import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type LessonStatsPageProps = {
  params: {
    id: string;
  };
};

export default async function LessonStatsPage({
  params,
}: LessonStatsPageProps): Promise<React.ReactElement> {
  const session = await auth();
  const adminId = session?.user?.id;

  if (!adminId) {
    notFound();
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      id: params.id,
      userId: adminId,
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
    notFound();
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

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-zinc-900">Lesson stats</h1>
        <Link
          href={`/admin/lessons/${lesson.id}`}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Back to lesson
        </Link>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-zinc-900">{lesson.title}</h2>
        <p className="text-sm text-zinc-600">Attempts: {attempts.length}</p>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-zinc-900">Attempt results</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const totalCount = attempt.totalCount ?? lesson.sentences.length;
                const totalScore = attempt.totalScore ?? attempt.answers.filter((answer) => answer.isCorrect).length;
                const accuracy = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) : 0;

                return (
                  <tr key={attempt.id} className="border-b border-zinc-100 text-zinc-800">
                    <td className="py-2 pr-4">{attempt.studentName}</td>
                    <td className="py-2 pr-4">{new Date(attempt.startedAt).toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      {totalScore}/{totalCount}
                    </td>
                    <td className="py-2">{accuracy}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="mb-3 text-lg font-semibold text-zinc-900">Sentence accuracy</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Sentence</th>
                <th className="py-2 pr-4">Correct</th>
                <th className="py-2 pr-4">Answered</th>
                <th className="py-2">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {lesson.sentences.map((sentence) => {
                const stats = sentenceStatsMap.get(sentence.id) ?? { correctCount: 0, totalAnswered: 0 };
                const accuracy = stats.totalAnswered > 0 ? Math.round((stats.correctCount / stats.totalAnswered) * 100) : 0;

                return (
                  <tr key={sentence.id} className="border-b border-zinc-100 text-zinc-800">
                    <td className="py-2 pr-4">{sentence.order}</td>
                    <td className="py-2 pr-4">{sentence.text}</td>
                    <td className="py-2 pr-4">{stats.correctCount}</td>
                    <td className="py-2 pr-4">{stats.totalAnswered}</td>
                    <td className="py-2">{accuracy}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
