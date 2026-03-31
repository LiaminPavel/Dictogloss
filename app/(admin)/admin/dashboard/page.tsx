import { auth } from "@/auth";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();
  const appBaseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const lessons = session?.user?.id
    ? await prisma.lesson.findMany({
        where: {
          userId: session.user.id,
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
      })
    : [];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Admin Dashboard</h1>
      <p className="text-zinc-700">
        Signed in as <span className="font-medium">{session?.user?.email ?? "unknown user"}</span>.
      </p>
      <p className="text-zinc-600">
        Phase 1 authentication is active. Continue with lesson management in Phase 2.
      </p>
      <Link
        href="/admin/lessons/new"
        className="inline-flex w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
      >
        Create a new lesson
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-zinc-900">Your lessons</h2>

        {lessons.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            No lessons yet. Create your first lesson to start generating audio.
          </div>
        ) : (
          <div className="grid gap-3">
            {lessons.map((lesson) => {
              const readyCount = lesson.sentences.filter((sentence) => sentence.audioStatus === "READY").length;
              const failedCount = lesson.sentences.filter((sentence) => sentence.audioStatus === "FAILED").length;
              const shareLink = `${appBaseUrl.replace(/\/$/, "")}/lesson/${lesson.shareToken}`;

              return (
                <article key={lesson.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-medium text-zinc-900">{lesson.title}</h3>
                    <p className="text-sm text-zinc-600">
                      Voice: {lesson.voice} ({lesson.accent}) • Sentences: {lesson._count.sentences} • Attempts:{" "}
                      {lesson._count.attempts}
                    </p>
                    <p className="text-sm text-zinc-600">
                      Audio ready: {readyCount}/{lesson._count.sentences}
                      {failedCount > 0 ? ` • Failed: ${failedCount}` : ""}
                    </p>
                    <p className="break-all text-sm text-zinc-700">Share link: {shareLink}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
