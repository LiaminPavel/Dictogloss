import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LoginForm } from "@/app/(auth)/login/login-form";

type LoginPageProps = {
  searchParams?: {
    from?: string;
  };
};

export default async function LoginPage({
  searchParams,
}: LoginPageProps): Promise<React.ReactElement> {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  const callbackUrl = searchParams?.from && searchParams.from.startsWith("/")
    ? searchParams.from
    : "/admin/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <LoginForm callbackUrl={callbackUrl} />
    </main>
  );
}
