const { PrismaClient } = require("@prisma/client");

async function main() {
    const prisma = new PrismaClient();
    try {
        // Check columns exist
        const cols = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_schema = 'integration' 
        AND table_name IN ('product_stock', 'omie_production_order', 'product_stock_command')
        AND column_name IN ('omie_code', 'product_code', 'product_id')
      ORDER BY table_name, column_name
    `);
        console.log("Remaining deprecated columns:", JSON.stringify(cols));

        // Check new columns
        const newCols = await prisma.$queryRawUnsafe(`
      SELECT table_name, column_name, is_nullable, coalesce(character_maximum_length::text, 'N/A') as max_len
      FROM information_schema.columns 
      WHERE table_schema = 'integration' 
        AND table_name IN ('product_stock', 'omie_production_order', 'product_stock_command')
        AND column_name LIKE '%product_omie%'
      ORDER BY table_name, column_name
    `);
        console.log("product_omie_id columns:", JSON.stringify(newCols));

        // Check constraints
        const constraints = await prisma.$queryRawUnsafe(`
      SELECT tc.table_name, tc.constraint_name, tc.constraint_type
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'integration'
        AND tc.table_name IN ('product_stock', 'omie_production_order')
        AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
      ORDER BY tc.table_name, tc.constraint_type
    `);
        console.log("Constraints:", JSON.stringify(constraints));

        // Count data
        const stockCount = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int AS t FROM integration.product_stock");
        const opCount = await prisma.$queryRawUnsafe("SELECT COUNT(*)::int AS t FROM integration.omie_production_order");
        console.log("ProductStock records:", stockCount[0].t);
        console.log("OmieProductionOrder records:", opCount[0].t);
    } catch (err) {
        console.error("ERROR:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();
