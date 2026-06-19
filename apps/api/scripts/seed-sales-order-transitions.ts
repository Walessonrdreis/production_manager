/**
 * Script para semear transições iniciais de etapa no banco.
 *
 * Para cada pedido no read-model atual, cria um registro de transição
 * com fromStage = null (indicando estado inicial desconhecido).
 *
 * Uso:
 *   pnpm --filter @production-manager/api tsx scripts/seed-sales-order-transitions.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("[seed] Lendo read-model atual...");

    const summaries = await prisma.salesOrderSummaryReadModel.findMany({
        select: {
            omieId: true,
            stage: true,
        },
    });

    console.log(`[seed] ${summaries.length} pedidos encontrados.`);

    let created = 0;
    let skipped = 0;

    for (const summary of summaries) {
        // Verificar se já existe transição para este pedido
        const existing = await prisma.salesOrderStageTransition.findFirst({
            where: { salesOrderOmieId: summary.omieId },
        });

        if (existing) {
            skipped += 1;
            continue;
        }

        await prisma.salesOrderStageTransition.create({
            data: {
                salesOrderOmieId: summary.omieId,
                fromStage: null,
                toStage: summary.stage,
            },
        });

        created += 1;
    }

    console.log(`[seed] Concluído! Criadas: ${created} | Puladas (já existem): ${skipped}`);
}

main()
    .catch((error) => {
        console.error("[seed] Erro:", error);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
