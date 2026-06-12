import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = "admin";
  const email = "admin@movepilot.local";
  const password = "Clave2026/";
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { username, email, name: "Admin", role: "admin", passwordHash },
    });
    console.log("Admin user updated:", existing.id);
  } else {
    const user = await prisma.user.create({
      data: { username, email, name: "Admin", role: "admin", passwordHash },
    });
    console.log("Admin user created:", user.id);
  }

  console.log("Login with username: admin / password: Clave2026/");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
