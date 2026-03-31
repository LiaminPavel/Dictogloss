import Link from "next/link";

import { auth } from "@/auth";
import { AdminNav } from "@/app/(admin)/admin/admin-nav";

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps): Promise<React.ReactElement> {
  const session = await auth();

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/dashboard" className="text-lg font-semibold text-zinc-900">
                Dictogloss Admin
              </Link>
              <span className="hidden text-sm text-zinc-500 sm:inline">
                {session?.user?.email ?? "unknown user"}
              </span>
            </div>
            <Link
              href="/"
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
            >
              Open student app
            </Link>
          </div>
          <AdminNav />
        </div>
      </header>

      {children}
    </div>
  );
}
