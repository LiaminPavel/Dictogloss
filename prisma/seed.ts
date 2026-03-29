import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

loadEnv({ path: ".env.local" });

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const passwordHash = await hash("Admin123!", 12);

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
