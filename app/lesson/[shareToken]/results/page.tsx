import Link from "next/link";
import { redirect } from "next/navigation";

type ResultsPageProps = {
  params: {
    shareToken: string;
  };
  searchParams: {
    attemptId?: string;
    score?: string;
    total?: string;
    name?: string;
  };
};

export default async function ResultsPage({
  params,
  searchParams,
}: ResultsPageProps): Promise<React.ReactElement> {
  if (!searchParams.attemptId) {
    redirect(`/lesson/${params.shareToken}`);
  }

  const score = Number(searchParams.score ?? "0");
  const total = Number(searchParams.total ?? "0");
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-zinc-900">Dictation completed</h1>
        <p className="mt-2 text-zinc-700">Student: {searchParams.name ?? "Anonymous"}</p>
        <p className="mt-2 text-zinc-700">
          Result: {score} of {total} ({percent}%)
        </p>
      </section>

      <div className="flex gap-3">
        <Link
          href={`/lesson/${params.shareToken}`}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Try again
        </Link>
      </div>
    </main>
  );
}
