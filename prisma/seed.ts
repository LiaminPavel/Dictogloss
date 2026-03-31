import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error("SEED_ADMIN_PASSWORD is required for seeding admin password.");
  }

  if (rawPassword.length < 12) {
    throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters.");
  }

  const passwordHash = await hash(rawPassword, 12);

  await prisma.user.upsert({
    where: { email: "admin@dictogloss.app" },
    update: {
      password: passwordHash,
      name: "Admin",
      role: "ADMIN",
      deletedAt: null,
    },
    create: {
      email: "admin@dictogloss.app",
      password: passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    await prisma.$disconnect();
    process.exit(1);
  });
