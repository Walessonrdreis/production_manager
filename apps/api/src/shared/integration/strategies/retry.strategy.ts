// ---------------------------------------------------------------------------
// Retry Strategy — fetchPageWithRetry + sleep + extractRedundantWaitSeconds
// ---------------------------------------------------------------------------
// Extraído dos padrões comuns entre sales-order-sync, customer-sync e
// product-stock-fetch. Centraliza a lógica de retry com backoff exponencial
// e detecção de erro "consumo redundante" da API Omie.
// ---------------------------------------------------------------------------

import { getLogger } from "@/shared/logger";
import type { RetryOptions } from "./types";

const log = getLogger("fetchPageWithRetry");

/**
 * Pausa a execução pelo número especificado de milissegundos.
 */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extrai o tempo de espera (em segundos) da mensagem de erro "consumo
 * redundante" da API Omie.
 *
 * Exemplo: "aguarde 60 segundos" → retorna 60
 */
export function extractRedundantWaitSeconds(sample: string): number | null {
    const match = sample.match(/aguarde\s+(\d+)\s+segundos/i);
    if (!match) return null;

    const seconds = Number(match[1]);
    if (!Number.isFinite(seconds) || seconds <= 0) return null;

    return seconds;
}

/**
 * Executa uma função de fetch com retry adaptativo:
 *
 * - **Erro comum**: Backoff exponencial (1s, 2s, 3s, ...) até `maxAttempts`
 * - **Consumo redundante**: Extrai tempo de espera da mensagem, aguarda +2s e
 *   retenta sem consumir uma tentativa, até `maxRedundantWaits`
 * - **Recuperação**: Loga checkpoint de recovery com contagem de attempts/waits
 *
 * @typeParam T — Tipo do resultado da página
 * @param fetchFn — Função que executa a chamada HTTP paginada
 * @param options — Opções de controle (label, attempts, redundant waits)
 */
export async function fetchPageWithRetry<T>(
    fetchFn: () => Promise<T>,
    options: RetryOptions
): Promise<T> {
    const {
        label,
        externalRequestId,
        page,
        pageSize,
        maxAttempts = 3,
        maxRedundantWaits = 5,
    } = options;

    let lastError: unknown = null;
    let redundantWaits = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const result = await fetchFn();

            if (attempt > 1 || redundantWaits > 0) {
                log.info(`${label} fetch page recovered after retry`, {
                    externalRequestId,
                    page,
                    pageSize,
                    attempt,
                    maxAttempts,
                    redundantWaits,
                });
            }

            return result;
        } catch (error: any) {
            lastError = error;

            if (maxRedundantWaits > 0) {
                const sample = String(error?.details?.sample ?? "");
                const isRedundant =
                    sample.toLowerCase().includes("redundant") ||
                    sample.toLowerCase().includes("consumo redundante");

                if (isRedundant) {
                    redundantWaits += 1;

                    const waitSeconds = extractRedundantWaitSeconds(sample) ?? 60;
                    const waitMs = (waitSeconds + 2) * 1000;

                    log.warn(`${label} REDUNDANT detected, waiting before retry`, {
                        externalRequestId,
                        page,
                        pageSize,
                        redundantWaits,
                        maxRedundantWaits,
                        waitSeconds,
                        waitMs,
                        code: error?.code,
                    });

                    if (redundantWaits > maxRedundantWaits) {
                        throw error;
                    }

                    await sleep(waitMs);
                    attempt -= 1;
                    continue;
                }
            }

            log.warn(`${label} fetch page failed`, {
                externalRequestId,
                page,
                pageSize,
                attempt,
                maxAttempts,
                message: error?.message,
                code: error?.code,
            });

            if (attempt < maxAttempts) {
                await sleep(1000 * attempt);
                continue;
            }
        }
    }

    throw lastError;
}
