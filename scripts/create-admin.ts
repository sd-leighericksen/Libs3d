// Usage: npm run create-admin -- <username> <password>
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error("Usage: npm run create-admin -- <username> <password>");
  process.exit(1);
}

const prisma = new PrismaClient();

async function main() {
  const hash = await argon2.hash(password);
  await prisma.adminUser.upsert({
    where: { username },
    update: { passwordHash: hash },
    create: { username, passwordHash: hash },
  });
  console.log(`Admin "${username}" ready.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
