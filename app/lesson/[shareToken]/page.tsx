import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";
import { StartForm } from "@/app/lesson/[shareToken]/start-form";

type LessonEntryPageProps = {
  params: {
    shareToken: string;
  };
};

export default async function LessonEntryPage({
  params,
}: LessonEntryPageProps): Promise<React.ReactElement> {
  const lesson = await prisma.lesson.findFirst({
    where: {
      shareToken: params.shareToken,
      deletedAt: null,
      isActive: true,
    },
    select: {
      title: true,
      voice: true,
      _count: {
        select: {
          sentences: true,
        },
      },
    },
  });

  if (!lesson) {
    notFound();
  }

  return (
    <StartForm
      shareToken={params.shareToken}
      title={lesson.title}
      sentenceCount={lesson._count.sentences}
      voice={lesson.voice}
    />
  );
}
