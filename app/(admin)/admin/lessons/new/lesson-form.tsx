"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

type Accent = "american" | "british";
type VoiceOption = {
  value: string;
  label: string;
  accent: Accent;
  description: string;
};

const voiceOptions: VoiceOption[] = [
  { value: "alloy", label: "Alloy", accent: "american", description: "Neutral" },
  { value: "nova", label: "Nova", accent: "american", description: "Female" },
  { value: "onyx", label: "Onyx", accent: "american", description: "Male" },
  { value: "echo", label: "Echo", accent: "british", description: "Neutral" },
  { value: "fable", label: "Fable", accent: "british", description: "Expressive" },
  { value: "shimmer", label: "Shimmer", accent: "british", description: "Female" },
];

const lessonSchema = z.object({
  title: z.string().trim().min(1, "Lesson title is required."),
  sentences: z.array(z.string().trim().min(1)).min(1, "Add at least one sentence."),
  voice: z.string().min(1, "Select a voice."),
  accent: z.enum(["american", "british"]),
});

export function LessonForm(): React.ReactElement {
  const [title, setTitle] = useState<string>("");
  const [sentencesInput, setSentencesInput] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy");
  const [selectedAccent, setSelectedAccent] = useState<Accent>("american");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<{
    completed: number;
    total: number;
  } | null>(null);
  const [shareLink, setShareLink] = useState<string>("");

  const sentenceList = useMemo<string[]>(() => {
    return sentencesInput
      .split("\n")
      .map((sentence) => sentence.trim())
      .filter((sentence) => sentence.length > 0);
  }, [sentencesInput]);

  const groupedVoices = useMemo<Record<Accent, VoiceOption[]>>(() => {
    return {
      american: voiceOptions.filter((voice) => voice.accent === "american"),
      british: voiceOptions.filter((voice) => voice.accent === "british"),
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");
    setShareLink("");
    setProgressState(null);

    const parsed = lessonSchema.safeParse({
      title,
      sentences: sentenceList,
      voice: selectedVoice,
      accent: selectedAccent,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data.");
      return;
    }

    setIsSubmitting(true);

    try {
      const createResponse = await fetch("/api/admin/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: parsed.data.title,
          voice: parsed.data.voice,
          accent: parsed.data.accent,
          sentences: parsed.data.sentences,
        }),
      });

      const createPayload = (await createResponse.json()) as {
        data: {
          lessonId: string;
          shareToken: string;
          sentenceCount: number;
        } | null;
        error: {
          message: string;
        } | null;
      };

      if (!createResponse.ok || !createPayload.data) {
        setErrorMessage(createPayload.error?.message ?? "Failed to create lesson.");
        return;
      }

      const lessonId = createPayload.data.lessonId;
      const total = createPayload.data.sentenceCount;
      setProgressState({ completed: 0, total });

      let completed = 0;
      while (completed < total) {
        const generateResponse = await fetch(`/api/admin/lessons/${lessonId}/generate`, {
          method: "POST",
        });

        const generatePayload = (await generateResponse.json()) as {
          data: {
            completed: number;
            total: number;
            done: boolean;
            shareUrl: string;
          } | null;
          error: {
            message: string;
          } | null;
        };

        if (!generateResponse.ok || !generatePayload.data) {
          setErrorMessage(generatePayload.error?.message ?? "Audio generation failed.");
          return;
        }

        completed = generatePayload.data.completed;
        setProgressState({
          completed,
          total: generatePayload.data.total,
        });

        if (generatePayload.data.done) {
          const origin = window.location.origin;
          setShareLink(`${origin}${generatePayload.data.shareUrl}`);
          break;
        }
      }
    } catch {
      setErrorMessage("Unexpected error while creating lesson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceSelect = (voice: VoiceOption): void => {
    setSelectedVoice(voice.value);
    setSelectedAccent(voice.accent);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <label htmlFor="lessonTitle" className="text-sm font-medium text-zinc-800">
          Lesson title
        </label>
        <input
          id="lessonTitle"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Past simple revision"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="sentences" className="text-sm font-medium text-zinc-800">
          Sentences (one sentence per line)
        </label>
        <textarea
          id="sentences"
          value={sentencesInput}
          onChange={(event) => setSentencesInput(event.target.value)}
          placeholder={"The cat sat on the mat.\nShe went to school yesterday."}
          rows={8}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
        />
        <p className="text-sm text-zinc-600">Sentences detected: {sentenceList.length}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium text-zinc-800">Voice selection</h2>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-zinc-700">American English</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {groupedVoices.american.map((voice) => {
              const isActive = selectedVoice === voice.value;
              return (
                <button
                  key={voice.value}
                  type="button"
                  onClick={() => handleVoiceSelect(voice)}
                  className={`rounded-lg border p-3 text-left transition ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-500"
                  }`}
                >
                  <p className="font-medium">{voice.label}</p>
                  <p className={`text-sm ${isActive ? "text-zinc-200" : "text-zinc-600"}`}>
                    {voice.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-zinc-700">British English</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {groupedVoices.british.map((voice) => {
              const isActive = selectedVoice === voice.value;
              return (
                <button
                  key={voice.value}
                  type="button"
                  onClick={() => handleVoiceSelect(voice)}
                  className={`rounded-lg border p-3 text-left transition ${
                    isActive
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-300 bg-white text-zinc-900 hover:border-zinc-500"
                  }`}
                >
                  <p className="font-medium">{voice.label}</p>
                  <p className={`text-sm ${isActive ? "text-zinc-200" : "text-zinc-600"}`}>
                    {voice.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-zinc-800">Sentence preview</h2>
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          {sentenceList.length === 0 ? (
            <p className="text-sm text-zinc-500">Your sentence preview will appear here.</p>
          ) : (
            <ol className="list-decimal space-y-2 pl-5 text-sm text-zinc-800">
              {sentenceList.map((sentence, index) => (
                <li key={`${sentence}-${index}`}>{sentence}</li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      {progressState ? (
        <p className="rounded-md bg-blue-50 p-3 text-sm text-blue-700">
          Generating audio: {progressState.completed} of {progressState.total} sentences.
        </p>
      ) : null}

      {shareLink ? (
        <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
          <p className="font-medium">Lesson is ready.</p>
          <p className="break-all">Shareable link: {shareLink}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 sm:w-fit"
      >
        {isSubmitting ? "Creating and generating..." : "Create lesson and generate audio"}
      </button>
    </form>
  );
}
