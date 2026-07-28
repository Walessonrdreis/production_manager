const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();
    try {
        // Delete orphan records (product_id was dropped, product_omie_id is NULL)
        const del = await prisma.$executeRawUnsafe(
            "DELETE FROM integration.product_stock_command WHERE product_omie_id IS NULL"
        );
        console.log(`Deleted ${del} orphan ProductStockCommand records`);

        // Now SET NOT NULL
        await prisma.$executeRawUnsafe(
            "ALTER TABLE integration.product_stock_command ALTER COLUMN product_omie_id SET NOT NULL"
        );
        console.log("product_omie_id SET NOT NULL on ProductStockCommand ✅");

        console.log("=== Cleanup completed ===");
    } catch (err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}
main();
