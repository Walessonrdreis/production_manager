import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // eslint-disable-next-line no-console
  console.log(Object.keys(prisma).filter(k => !k.startsWith("_")).sort());
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});