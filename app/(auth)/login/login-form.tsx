"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormProps = {
  callbackUrl: string;
};

export function LoginForm({ callbackUrl }: LoginFormProps): React.ReactElement {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    };

    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) {
      setErrorMessage(parsed.error.issues[0]?.message ?? "Invalid form data.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
        callbackUrl,
      });

      if (!result) {
        setErrorMessage("Authentication failed.");
        return;
      }

      if (result.error) {
        setErrorMessage("Invalid email or password.");
        return;
      }

      const destination = result.url ?? callbackUrl;
      window.location.assign(destination);
    } catch {
      setErrorMessage("Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-zinc-900">Admin Login</h1>

      <label className="flex flex-col gap-2 text-sm text-zinc-700">
        <span>Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
          placeholder="admin@dictogloss.app"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm text-zinc-700">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none"
          placeholder="Enter password"
        />
      </label>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
