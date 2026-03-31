"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SentenceItem = {
  id: string;
  order: number;
  audioStatus: "PENDING" | "PROCESSING" | "READY" | "FAILED";
  hasAudio: boolean;
  textPreview: string;
};

type LessonDetail = {
  id: string;
  title: string;
  shareToken: string;
  voice: string;
  accent: string;
  sentenceCount: number;
  attemptCount: number;
  sentences: SentenceItem[];
};

type LessonDetailClientProps = {
  lessonId: string;
  appBaseUrl: string;
};

export function LessonDetailClient({ lessonId, appBaseUrl }: LessonDetailClientProps): React.ReactElement {
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [pendingSentenceId, setPendingSentenceId] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const router = useRouter();

  const fetchLesson = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        data: LessonDetail | null;
        error: { message: string } | null;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error?.message ?? "Failed to load lesson.");
        setLesson(null);
        return;
      }

      setLesson(payload.data);
    } catch {
      setErrorMessage("Failed to load lesson.");
      setLesson(null);
    } finally {
      setIsLoading(false);
    }
  }, [lessonId]);

  useEffect(() => {
    void fetchLesson();
  }, [fetchLesson]);

  const shareLink = useMemo<string>(() => {
    if (!lesson) {
      return "";
    }
    return `${appBaseUrl.replace(/\/$/, "")}/lesson/${lesson.shareToken}`;
  }, [appBaseUrl, lesson]);

  const handleCopyLink = async (): Promise<void> => {
    if (!shareLink) {
      return;
    }
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  };

  const handleRegenerate = async (sentenceId: string): Promise<void> => {
    setPendingSentenceId(sentenceId);
    setErrorMessage("");
    try {
      const response = await fetch(
        `/api/admin/lessons/${lessonId}/sentences/${sentenceId}/regenerate`,
        { method: "POST" },
      );

      const payload = (await response.json()) as {
        data: { sentenceId: string; status: string } | null;
        error: { message: string } | null;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error?.message ?? "Regeneration failed.");
      }
    } catch {
      setErrorMessage("Regeneration failed.");
    } finally {
      setPendingSentenceId("");
      await fetchLesson();
    }
  };

  const handleDeleteLesson = async (): Promise<void> => {
    setIsDeleting(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/admin/lessons/${lessonId}`, { method: "DELETE" });
      const payload = (await response.json()) as {
        data: { deleted: boolean } | null;
        error: { message: string } | null;
      };
      if (!response.ok || !payload.data?.deleted) {
        setErrorMessage(payload.error?.message ?? "Failed to delete lesson.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Failed to delete lesson.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <p className="text-zinc-600">Loading lesson details...</p>;
  }

  if (!lesson) {
    return <p className="text-red-600">{errorMessage || "Lesson not found."}</p>;
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h2 className="text-xl font-semibold text-zinc-900">{lesson.title}</h2>
        <p className="text-sm text-zinc-600">
          Voice: {lesson.voice} ({lesson.accent}) • Sentences: {lesson.sentenceCount} • Attempts:{" "}
          {lesson.attemptCount}
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <p className="text-sm font-medium text-zinc-900">Shareable link</p>
        <p className="mt-1 break-all text-sm text-zinc-700">{shareLink}</p>
        <button
          type="button"
          onClick={handleCopyLink}
          className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Copy link
        </button>
        {copyState === "copied" ? <p className="mt-2 text-sm text-emerald-700">Link copied.</p> : null}
        {copyState === "failed" ? <p className="mt-2 text-sm text-red-600">Failed to copy link.</p> : null}
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white p-4">
        <h3 className="text-lg font-semibold text-zinc-900">Sentences</h3>
        <div className="mt-3 space-y-3">
          {lesson.sentences.map((sentence) => (
            <article key={sentence.id} className="rounded-md border border-zinc-200 p-3">
              <p className="text-sm font-medium text-zinc-900">
                #{sentence.order} • Status: {sentence.audioStatus}
              </p>
              <p className="mt-1 text-sm text-zinc-700">{sentence.textPreview}</p>
              {sentence.audioStatus === "FAILED" ? (
                <button
                  type="button"
                  disabled={pendingSentenceId === sentence.id}
                  onClick={() => {
                    void handleRegenerate(sentence.id);
                  }}
                  className="mt-2 rounded-md bg-amber-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
                >
                  {pendingSentenceId === sentence.id ? "Regenerating..." : "Regenerate failed audio"}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            void handleDeleteLesson();
          }}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
        >
          {isDeleting ? "Deleting..." : "Delete lesson"}
        </button>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </section>
  );
}
