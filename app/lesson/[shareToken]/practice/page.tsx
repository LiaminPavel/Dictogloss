import { notFound, redirect } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { PracticeClient } from "@/app/lesson/[shareToken]/practice/practice-client";

type PracticePageProps = {
  params: {
    shareToken: string;
  };
  searchParams: {
    attemptId?: string;
    name?: string;
  };
};

export default async function PracticePage({
  params,
  searchParams,
}: PracticePageProps): Promise<React.ReactElement> {
  if (!searchParams.attemptId) {
    redirect(`/lesson/${params.shareToken}`);
  }

  const lesson = await prisma.lesson.findFirst({
    where: {
      shareToken: params.shareToken,
      deletedAt: null,
      isActive: true,
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
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  const attempt = await prisma.lessonAttempt.findFirst({
    where: {
      id: searchParams.attemptId,
      lessonId: lesson.id,
    },
    select: {
      id: true,
      studentName: true,
    },
  });

  if (!attempt) {
    redirect(`/lesson/${params.shareToken}`);
  }

  return (
    <PracticeClient
      shareToken={params.shareToken}
      attemptId={attempt.id}
      studentName={searchParams.name ?? attempt.studentName}
      title={lesson.title}
      sentences={lesson.sentences}
    />
  );
}
