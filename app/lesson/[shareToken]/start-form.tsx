"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type StartFormProps = {
  shareToken: string;
  title: string;
  sentenceCount: number;
  voice: string;
};

export function StartForm({
  shareToken,
  title,
  sentenceCount,
  voice,
}: StartFormProps): React.ReactElement {
  const [studentName, setStudentName] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const router = useRouter();

  const handleStart = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");

    const normalizedName = studentName.trim();
    if (!normalizedName) {
      setErrorMessage("Please enter your name.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/lesson/${shareToken}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentName: normalizedName }),
      });

      const payload = (await response.json()) as {
        data: { attemptId: string } | null;
        error: { message: string } | null;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error?.message ?? "Failed to start lesson.");
        return;
      }

      const url = `/lesson/${shareToken}/practice?attemptId=${encodeURIComponent(
        payload.data.attemptId,
      )}&name=${encodeURIComponent(normalizedName)}`;
      router.push(url);
    } catch {
      setErrorMessage("Failed to start lesson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center gap-6 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold text-zinc-900">{title}</h1>
        <p className="text-zinc-600">
          Sentences: {sentenceCount} • Voice: {voice}
        </p>
      </header>

      <form onSubmit={handleStart} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <label htmlFor="studentName" className="mb-2 block text-sm font-medium text-zinc-800">
          Enter your name
        </label>
        <input
          id="studentName"
          value={studentName}
          onChange={(event) => setStudentName(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
          placeholder="Anna"
        />

        {errorMessage ? <p className="mt-2 text-sm text-red-600">{errorMessage}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {isSubmitting ? "Starting..." : "Start"}
        </button>
      </form>
    </main>
  );
}
