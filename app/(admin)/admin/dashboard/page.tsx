import { auth } from "@/auth";

export default async function AdminDashboardPage(): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-4 px-4 py-12">
      <h1 className="text-3xl font-semibold text-zinc-900">Admin Dashboard</h1>
      <p className="text-zinc-700">
        Signed in as <span className="font-medium">{session?.user?.email ?? "unknown user"}</span>.
      </p>
      <p className="text-zinc-600">
        Phase 1 authentication is active. Continue with lesson management in Phase 2.
      </p>
    </main>
  );
}
