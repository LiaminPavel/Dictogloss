import { LessonForm } from "@/app/(admin)/admin/lessons/new/lesson-form";

export default function NewLessonPage(): React.ReactElement {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-zinc-900">Create lesson</h1>
        <p className="text-zinc-600">
          Paste one sentence per line, select a voice, and review the generated sentence list before submission.
        </p>
      </header>

      <LessonForm />
    </main>
  );
}
