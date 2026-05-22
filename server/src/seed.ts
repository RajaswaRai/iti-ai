import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "garxboss@gmail.com";
  
  // Cek apakah user sudah ada
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash("prialunak34", 10);
    await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        name: "Super Admin ITI",
        role: "SUPER_ADMIN"
      }
    });
    console.log("Data Admin berhasil disuntikkan!");
  }
}

main().catch(console.error);