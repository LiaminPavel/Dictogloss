import { auth } from "@/auth";

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "STUDENT";
};

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();

  if (!session?.user?.id || !session.user.email || !session.user.name || !session.user.role) {
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  return user;
}
