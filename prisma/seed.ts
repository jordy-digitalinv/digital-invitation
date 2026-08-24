import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "admin@digitalinvitation.my.id" },
  });

  if (existing) {
    console.log("Seed: Admin sudah ada.");
    return;
  }

  const hashed = await bcrypt.hash("admin123", 12);

  await prisma.user.create({
    data: {
      email: "admin@digitalinvitation.my.id",
      password: hashed,
      name: "Super Admin",
      role: "SUPERADMIN",
    },
  });

  console.log("Seed: Admin berhasil dibuat.");
  console.log("Email: admin@digitalinvitation.my.id");
  console.log("Password: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
