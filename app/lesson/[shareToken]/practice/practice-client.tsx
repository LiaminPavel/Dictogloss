"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SentenceMeta = {
  id: string;
  order: number;
};

type PracticeClientProps = {
  shareToken: string;
  attemptId: string;
  studentName: string;
  title: string;
  sentences: SentenceMeta[];
};

export function PracticeClient({
  shareToken,
  attemptId,
  studentName,
  title,
  sentences,
}: PracticeClientProps): React.ReactElement {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [studentText, setStudentText] = useState<string>("");
  const [remainingPlays, setRemainingPlays] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; correctText?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [score, setScore] = useState<number>(0);
  const router = useRouter();

  const currentSentence = sentences[currentIndex];
  const total = sentences.length;
  const progressPercent = useMemo<number>(() => {
    if (total === 0) {
      return 0;
    }
    return Math.round(((currentIndex + 1) / total) * 100);
  }, [currentIndex, total]);

  const goToNextSentence = async (finalScoreOverride?: number): Promise<void> => {
    setStudentText("");
    setFeedback(null);
    setErrorMessage("");
    setRemainingPlays(3);

    if (currentIndex + 1 >= total) {
      await fetch(`/api/lesson/${shareToken}/attempt/${attemptId}/complete`, {
        method: "PATCH",
      });
      const finalScore = typeof finalScoreOverride === "number" ? finalScoreOverride : score;
      router.push(
        `/lesson/${shareToken}/results?attemptId=${encodeURIComponent(attemptId)}&score=${finalScore}&total=${total}&name=${encodeURIComponent(studentName)}`,
      );
      return;
    }

    setCurrentIndex((prev) => prev + 1);
  };

  const handlePlay = async (): Promise<void> => {
    if (!currentSentence || remainingPlays <= 0 || isPlaying) {
      return;
    }

    setErrorMessage("");
    setIsPlaying(true);
    try {
      const response = await fetch(
        `/api/lesson/${shareToken}/audio/${currentSentence.id}?attemptId=${encodeURIComponent(attemptId)}`,
      );
      const payload = (await response.json()) as {
        data: {
          audioUrl: string;
          remainingPlays: number;
        } | null;
        error: { message: string } | null;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error?.message ?? "Failed to load audio.");
        return;
      }

      setRemainingPlays(payload.data.remainingPlays);

      const audio = new Audio(payload.data.audioUrl);
      await audio.play();
    } catch {
      setErrorMessage("Failed to load audio.");
    } finally {
      setIsPlaying(false);
    }
  };

  const handleSubmitAnswer = async (): Promise<void> => {
    if (!currentSentence || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const response = await fetch(`/api/lesson/${shareToken}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          sentenceId: currentSentence.id,
          studentText,
        }),
      });
      const payload = (await response.json()) as {
        data: {
          isCorrect: boolean;
          correctText: string | null;
        } | null;
        error: { message: string } | null;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.error?.message ?? "Failed to submit answer.");
        return;
      }

      if (payload.data.isCorrect) {
        const updatedScore = score + 1;
        setFeedback({ isCorrect: true });
        setScore(updatedScore);
        window.setTimeout(() => {
          void goToNextSentence(updatedScore);
        }, 2000);
      } else {
        setFeedback({
          isCorrect: false,
          correctText: payload.data.correctText ?? "",
        });
      }
    } catch {
      setErrorMessage("Failed to submit answer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentSentence) {
    return <p className="text-red-600">No sentences available.</p>;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="text-sm text-zinc-700">
          {studentName} • Sentence {currentIndex + 1} of {total}
        </p>
        <div className="h-2 w-full rounded-full bg-zinc-200">
          <div className="h-2 rounded-full bg-zinc-900" style={{ width: `${progressPercent}%` }} />
        </div>
      </header>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <button
          type="button"
          disabled={remainingPlays <= 0 || isPlaying}
          onClick={() => {
            void handlePlay();
          }}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {isPlaying ? "Playing..." : "Play"}
        </button>
        <p className="mt-2 text-sm text-zinc-600">
          Remaining plays: {remainingPlays}
          {remainingPlays <= 0 ? " (limit reached)" : ""}
        </p>

        <textarea
          value={studentText}
          onChange={(event) => setStudentText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !feedback) {
              event.preventDefault();
              void handleSubmitAnswer();
            }
          }}
          placeholder="Type what you hear..."
          rows={4}
          className="mt-4 w-full rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
          disabled={Boolean(feedback)}
        />

        {!feedback ? (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmitAnswer();
            }}
            className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {isSubmitting ? "Checking..." : "Check (Enter)"}
          </button>
        ) : null}
      </section>

      {feedback?.isCorrect ? (
        <section className="rounded-md bg-emerald-50 p-4 text-emerald-700">
          Correct. Moving to the next sentence in 2 seconds...
        </section>
      ) : null}

      {feedback && !feedback.isCorrect ? (
        <section className="rounded-md bg-red-50 p-4 text-red-700">
          <p>Wrong answer.</p>
          <p className="mt-1">Correct text: {feedback.correctText}</p>
          <button
            type="button"
            onClick={() => {
              void goToNextSentence();
            }}
            className="mt-3 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
          >
            Continue
          </button>
        </section>
      ) : null}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
    </main>
  );
}
