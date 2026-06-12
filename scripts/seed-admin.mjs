import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME?.trim() || "admin";
  const email = process.env.ADMIN_EMAIL?.trim() || "admin@movepilot.local";
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!password || password.length < 8) {
    console.error("Set ADMIN_PASSWORD (min 8 chars) before running seed:admin");
    process.exit(1);
  }

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

  console.log(`Admin ready: username "${username}", email "${email}"`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
