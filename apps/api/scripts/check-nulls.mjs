// Quick validation script — check for NULL product_omie_id
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
    const stock = await prisma.$queryRawUnsafe(
        "SELECT COUNT(*)::int AS total_nulos FROM integration.product_stock WHERE product_omie_id IS NULL"
    );
    const ops = await prisma.$queryRawUnsafe(
        "SELECT COUNT(*)::int AS total_nulos FROM integration.omie_production_order WHERE product_omie_id IS NULL"
    );
    console.log("ProductStock NULL product_omie_id:", stock[0].total_nulos);
    console.log("OmieProductionOrder NULL product_omie_id:", ops[0].total_nulos);
} catch (err) {
    console.error("ERROR:", err);
} finally {
    await prisma.$disconnect();
}
