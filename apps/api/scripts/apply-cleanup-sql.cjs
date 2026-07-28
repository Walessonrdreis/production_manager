// Apply cleanup SQL — DROP ambiguous columns, add NOT NULL + UNIQUE
const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();
    try {
        console.log("=== Applying cleanup SQL ===");

        // 1. ProductStock — drop omie_code, make product_omie_id NOT NULL + UNIQUE
        console.log("1/3 DROP omie_code from ProductStock...");
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock DROP COLUMN IF EXISTS omie_code"
        );

        console.log("   SET product_omie_id NOT NULL...");
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock ALTER COLUMN product_omie_id SET NOT NULL"
        );

        console.log("   ADD UNIQUE on product_omie_id...");
        // Drop existing unique on omie_code first (cascade handles it), add new one
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock ADD CONSTRAINT uq_product_stock_omie_id UNIQUE (product_omie_id)"
        );

        // 2. OmieProductionOrder — drop product_code
        console.log("2/3 DROP product_code from OmieProductionOrder...");
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.omie_production_order DROP COLUMN IF EXISTS product_code"
        );

        // 3. ProductStockCommand — drop product_id, make product_omie_id NOT NULL
        console.log("3/3 DROP product_id from ProductStockCommand...");
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock_command DROP COLUMN IF EXISTS product_id"
        );

        console.log("   SET product_omie_id NOT NULL...");
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock_command ALTER COLUMN product_omie_id SET NOT NULL"
        );

        console.log("=== Cleanup SQL completed successfully ===");
    } catch (err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
