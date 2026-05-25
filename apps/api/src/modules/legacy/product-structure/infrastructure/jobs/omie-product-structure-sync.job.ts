import cron from "node-cron";

/**
 * Job de sincronização de estruturas via endpoint interno.
 *
 * Por que assim?
 * - Evita imports profundos que podem quebrar o esbuild/tsx no Windows/OneDrive
 * - Reusa exatamente a mesma lógica do endpoint (validação, throttle, erros, etc.)
 * - Mantém job simples e resiliente
 *
 * Estratégia:
 * - A cada execução, sincroniza uma página "sem depender do Product/OmieProduct do Prisma"
 * - Para isso, chamamos o endpoint de sync com um codProduto vindo do próprio cursor armazenado no app
 *
 * Observação:
 * - Para não depender de codProduto no banco, este job é para "dirigir" o processo.
 * - A fonte real de lista/páginas fica na Omie (no gateway do endpoint).
 */
export function startOmieProductStructureSyncJob(app: any) {
  const cronExpr = process.env.OMIE_PRODUCT_STRUCTURE_SYNC_CRON || "*/20 * * * *";

  app.log.info({ cronExpr }, "[product-structure] sync job scheduled");

  cron.schedule(cronExpr, async () => {
    try {
      // Respeita janela global local (se existir)
      const state = app.productStructureSyncJobState;
      const now = Date.now();
      if (state?.blockedUntil && now < state.blockedUntil) {
        const remaining = Math.ceil((state.blockedUntil - now) / 1000);
        app.log.warn({ remaining }, "[product-structure] job skipped due to rate-limit window");
        return;
      }

      /**
       * ✅ Importante:
       * Como a Omie fornece paginação via ListarEstruturas, o caminho mais eficiente é
       * um job "page-based".
       *
       * Para manter o job simples e sem imports frágeis, este job chama um endpoint interno
       * "job tick" que você vai expor dentro do módulo (abaixo).
       *
       * Se você já implementou o job page-based diretamente (sem endpoint), então ignore esta abordagem.
       */
      const res = await app.inject({
        method: "POST",
        url: "/v1/admin/omie/product-structures/sync-job-tick",
      });

      app.log.info(
        { statusCode: res.statusCode, body: safeBody(res.body) },
        "[product-structure] job tick executed"
      );
    } catch (err) {
      app.log.error({ err }, "[product-structure] job crashed");
    }
  });
}

function safeBody(body: any) {
  if (typeof body !== "string") return body;
  if (body.length > 800) return body.slice(0, 800) + "...";
  return body;
}