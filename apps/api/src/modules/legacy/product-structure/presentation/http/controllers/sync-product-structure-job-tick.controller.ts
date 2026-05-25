import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Executa 1 "tick" de sync por página:
 * - chama Omie ListarEstruturas na página atual
 * - persiste cada estrutura (idempotente)
 * - avança cursor
 *
 * O estado do cursor fica em app.productStructureSyncJobState (decorado no index.ts do módulo).
 */
export async function syncProductStructureJobTickController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const gateway: any = (req.server as any).productStructureGateway;
    const repo: any = (req.server as any).productStructureRepository;
    const state = (req.server as any).productStructureSyncJobState;

    const now = Date.now();
    if (state.blockedUntil && now < state.blockedUntil) {
      const remaining = Math.ceil((state.blockedUntil - now) / 1000);
      return reply
        .header("Retry-After", String(remaining))
        .code(429)
        .send({ code: "OMIE_REDUNDANT", retryAfterSeconds: remaining });
    }

    const page = state.page ?? 1;
    const pageSize = state.pageSize ?? 100;

    const r = await gateway.listStructuresPage(page, pageSize);

    let persisted = 0;
    let skipped = 0;

    for (const estrutura of r.estruturas) {
      const codProduto = estrutura?.ident?.codProduto?.trim();
      if (!codProduto) continue;

      // reaproveita o próprio endpoint manual via use case (mais simples)
      // mas isso chama Omie de novo — então aqui persistimos direto pelo repo+hash
      const upsertBase = (req.server as any).productStructureMapOmieToUpsert(estrutura);

      const structureHash = (req.server as any).productStructureComputeHash(upsertBase);

      const existing = await repo.findByCodProduto(upsertBase.codProduto);
      if (existing?.structureHash && existing.structureHash === structureHash) {
        skipped++;
        continue;
      }

      await repo.upsertStructureWithItems({ ...upsertBase, structureHash });
      persisted++;
    }

    // avança cursor
    if (typeof r.totalPages === "number" && r.totalPages > 0) {
      state.page = page >= r.totalPages ? 1 : page + 1;
    } else {
      state.page = page + 1;
    }

    return reply.code(200).send({
      pageProcessed: page,
      nextPage: state.page,
      persisted,
      skipped,
      count: r.estruturas.length,
    });
  } catch (e: any) {
    if (e?.code === "OMIE_REDUNDANT") {
      const retryAfter = e?.retryAfterSeconds ?? 60;
      const state = (req.server as any).productStructureSyncJobState;
      state.blockedUntil = Date.now() + retryAfter * 1000;

      return reply
        .header("Retry-After", String(retryAfter))
        .code(429)
        .send({ code: "OMIE_REDUNDANT", retryAfterSeconds: retryAfter, message: e.message });
    }

    req.log?.error?.({ err: e }, "[product-structure] job tick failed");
    return reply.code(500).send({ code: "INTERNAL_ERROR", message: "Erro interno" });
  }
}
``