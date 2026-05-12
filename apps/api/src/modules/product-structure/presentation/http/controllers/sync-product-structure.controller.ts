import type { FastifyReply, FastifyRequest } from "fastify";

type Body = {
  codProduto?: string;
  idProduto?: number;
  intProduto?: string;
};

function resolveInFlightKey(body?: Body): string | null {
  const cod = body?.codProduto?.trim();
  if (cod) return `cod:${cod}`;

  if (typeof body?.idProduto === "number" && !Number.isNaN(body.idProduto)) {
    return `id:${body.idProduto}`;
  }

  const intp = body?.intProduto?.trim();
  if (intp) return `int:${intp}`;

  return null;
}

function secondsUntil(tsMs: number) {
  const now = Date.now();
  if (tsMs <= now) return 0;
  return Math.ceil((tsMs - now) / 1000);
}

export async function syncProductStructureController(
  req: FastifyRequest<{ Body: Body }>,
  reply: FastifyReply
) {
  // ✅ throttle local: se Omie mandou aguardar, não chamamos de novo até liberar
  const blockedUntil = req.server.omieMalhaRateLimit.blockedUntil ?? 0;
  const remaining = secondsUntil(blockedUntil);

  if (remaining > 0) {
    return reply
      .header("Retry-After", String(remaining))
      .code(429)
      .send({
        message: "Omie temporariamente bloqueada para consulta de malha (janela de rate-limit).",
        code: "OMIE_REDUNDANT",
        retryAfterSeconds: remaining,
      });
  }

  const key = resolveInFlightKey(req.body);

  // ✅ single-flight: se já tem sync em voo para esse key, reaproveita
  if (key) {
    const inFlight = req.server.productStructureInFlight;
    const running = inFlight.get(key);

    if (running) {
      try {
        const result = await running;
        return reply.code(200).send(result);
      } catch (e: any) {
        // cai para o handler comum de erros abaixo
      }
    }

    const promise = req.server.productStructure.syncUseCase.execute(req.body ?? {});
    inFlight.set(key, promise);

    try {
      const result = await promise;
      return reply.code(200).send(result);
    } catch (e: any) {
      // tratamento abaixo
      const code = e?.code;

      if (code === "VALIDATION_ERROR") {
        return reply.code(400).send({ message: e.message, code });
      }

      if (code === "OMIE_REDUNDANT") {
        const retryAfter = e?.retryAfterSeconds ?? 60;
        // ✅ memoriza janela local para evitar re-bater na Omie
        req.server.omieMalhaRateLimit.blockedUntil = Date.now() + retryAfter * 1000;

        return reply
          .header("Retry-After", String(retryAfter))
          .code(429)
          .send({
            message: e.message,
            code,
            retryAfterSeconds: retryAfter,
            details: e?.details,
          });
      }

      if (code === "OMIE_NOT_FOUND") {
        return reply.code(404).send({ message: e.message, code });
      }

      if (code === "OMIE_HTTP_ERROR" || code === "OMIE_FAULT" || code === "INTEGRATION_ERROR") {
        return reply.code(502).send({ message: e.message, code, details: e?.details });
      }

      req.log?.error?.({ err: e }, "sync product-structure failed");
      return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
    } finally {
      inFlight.delete(key);
    }
  }

  // ✅ sem key (body inválido ou incompleto) -> deixa o use case validar
  try {
    const result = await req.server.productStructure.syncUseCase.execute(req.body ?? {});
    return reply.code(200).send(result);
  } catch (e: any) {
    const code = e?.code;

    if (code === "VALIDATION_ERROR") {
      return reply.code(400).send({ message: e.message, code });
    }

    if (code === "OMIE_REDUNDANT") {
      const retryAfter = e?.retryAfterSeconds ?? 60;
      req.server.omieMalhaRateLimit.blockedUntil = Date.now() + retryAfter * 1000;

      return reply
        .header("Retry-After", String(retryAfter))
        .code(429)
        .send({
          message: e.message,
          code,
          retryAfterSeconds: retryAfter,
          details: e?.details,
        });
    }

    if (code === "OMIE_NOT_FOUND") {
      return reply.code(404).send({ message: e.message, code });
    }

    if (code === "OMIE_HTTP_ERROR" || code === "OMIE_FAULT" || code === "INTEGRATION_ERROR") {
      return reply.code(502).send({ message: e.message, code, details: e?.details });
    }

    req.log?.error?.({ err: e }, "sync product-structure failed");
    return reply.code(500).send({ message: "Erro interno", code: "INTERNAL_ERROR" });
  }
}