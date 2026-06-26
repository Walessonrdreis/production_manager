const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();
    try {
        // Check nulls in product_stock_command
        const nulls = await prisma.$queryRawUnsafe(
            "SELECT COUNT(*)::int AS total FROM integration.product_stock_command WHERE product_omie_id IS NULL"
        );
        console.log("ProductStockCommand NULL product_omie_id:", nulls[0].total);

        const total = await prisma.$queryRawUnsafe(
            "SELECT COUNT(*)::int AS total FROM integration.product_stock_command"
        );
        console.log("ProductStockCommand total:", total[0].total);

        // Sample some records
        if (nulls[0].total > 0) {
            const samples = await prisma.$queryRawUnsafe(
                "SELECT id, external_request_id, product_id, product_omie_id, command_type, status, created_at FROM integration.product_stock_command WHERE product_omie_id IS NULL LIMIT 5"
            );
            console.log("Sample NULL records:", JSON.stringify(samples, null, 2));
        }
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
