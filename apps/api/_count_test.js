const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  const count = await p.omieProductionOrder.count();
  console.log('omie_production_order count:', count);
}
main().catch(e => console.error(e)).finally(() => p.$disconnect());
