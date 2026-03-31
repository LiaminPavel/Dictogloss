import Link from "next/link";

import { LessonDetailClient } from "@/app/(admin)/admin/lessons/[id]/lesson-detail-client";

type LessonDetailPageProps = {
  params: {
    id: string;
  };
};

export default function LessonDetailPage({ params }: LessonDetailPageProps): React.ReactElement {
  const appBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-zinc-900">Lesson detail</h1>
        <Link
          href="/admin/dashboard"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
        >
          Back to dashboard
        </Link>
      </div>

      <LessonDetailClient lessonId={params.id} appBaseUrl={appBaseUrl} />
    </main>
  );
}
