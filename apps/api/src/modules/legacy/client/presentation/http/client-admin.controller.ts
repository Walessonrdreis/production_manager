// File: apps/api/src/modules/client/presentation/http/client-admin.controller.ts

import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "@/shared/errors/AppError";

function isOmieRedundantError(err: any): boolean {
  const sample = err?.details?.sample;
  if (typeof sample !== "string") return false;
  return sample.includes("REDUNDANT") || sample.includes("Consumo redundante");
}

export class ClientAdminController {
  async syncFromOmie(request: FastifyRequest, reply: FastifyReply) {
    const state = request.server.clientSyncState;

    // ✅ lock: prevent concurrent sync
    if (state.running) {
      return reply.code(409).send({
        error: {
          code: "CLIENT_SYNC_RUNNING",
          message: "Client sync is already running.",
          requestId: request.requestId,
        },
      });
    }

    // ✅ cooldown: prevent frequent calls (avoid Omie redundant)
    const now = Date.now();
    const last = state.lastStartedAt?.getTime() ?? 0;
    const cooldownMs = 65_000; // pequena folga para evitar REDUNDANT
    if (last && now - last < cooldownMs) {
      return reply.code(429).send({
        error: {
          code: "CLIENT_SYNC_COOLDOWN",
          message: "Client sync was triggered recently. Try again later.",
          requestId: request.requestId,
        },
      });
    }

    state.running = true;
    state.lastStartedAt = new Date();

    try {
      request.log.info("[ClientAdmin] Omie client sync started");
      await request.server.syncOmieClientsUseCase.execute();
      request.log.info("[ClientAdmin] Omie client sync finished");

      state.lastFinishedAt = new Date();

      return reply.code(204).send();
    } catch (err: any) {
      // ✅ Omie REDUNDANT -> treat as 429 (do not bubble as 502)
      if (isOmieRedundantError(err)) {
        request.log.warn({ err }, "[ClientAdmin] Omie redundant consumption detected");
        return reply.code(429).send({
          error: {
            code: "OMIE_REDUNDANT",
            message: "Omie refused the request due to redundant consumption. Try again later.",
            requestId: request.requestId,
          },
        });
      }

      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError("CLIENT_SYNC_FAILED", 500, "Falha ao sincronizar clientes no Omie", {
        message: err?.message,
      });
    } finally {
      state.running = false;
    }
  }
}
