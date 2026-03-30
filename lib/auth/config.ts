import type { NextAuthConfig, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials): Promise<{
        id: string;
        email: string;
        name: string;
        role: "ADMIN" | "STUDENT";
      } | null> => {
        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          });

          if (!user || user.deletedAt !== null) {
            return null;
          }

          const passwordMatches = await compare(parsed.data.password, user.password);
          if (!passwordMatches) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({
      token,
      user,
    }: {
      token: JWT;
      user?: User;
    }): Promise<JWT> => {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },
    session: async ({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }): Promise<Session> => {
      if (session.user) {
        session.user.id = typeof token.id === "string" ? token.id : "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "STUDENT";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
