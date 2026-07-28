// src/shared/integrations/omie/omie.client.ts
import { AppError } from "@/shared/errors/AppError";

export type OmieClientConfig = {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  timeoutMs?: number;

  /**
   * Retry para falhas transitórias (rede/timeout/5xx).
   * Default: 2 retries (total 3 tentativas).
   */
  retry?: {
    attempts?: number; // total de tentativas (inclui a primeira)
    baseDelayMs?: number; // base do backoff
    maxDelayMs?: number; // teto do backoff
  };

  /**
   * Se true, pode logar informações mínimas (ex.: path/call) fora de produção.
   * Nunca loga segredo.
   */
  debug?: boolean;
};

export type OmieLogger = {
  info?: (obj: any, msg?: string) => void;
  warn?: (obj: any, msg?: string) => void;
  error?: (obj: any, msg?: string) => void;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function withJitter(ms: number) {
  // jitter leve +-20%
  const jitter = ms * 0.2;
  const min = ms - jitter;
  const max = ms + jitter;
  return Math.max(0, Math.round(min + Math.random() * (max - min)));
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function isLikelyTransientNetworkError(err: any): boolean {
  const name = String(err?.name ?? "");
  const msg = String(err?.message ?? "").toLowerCase();

  // AbortError / timeout
  if (name === "AbortError") return true;

  // Node/undici/fetch errors comuns
  if (msg.includes("fetch failed")) return true;
  if (msg.includes("timeout")) return true;
  if (msg.includes("timed out")) return true;
  if (msg.includes("network")) return true;
  if (msg.includes("econnreset")) return true;
  if (msg.includes("enotfound")) return true;
  if (msg.includes("eai_again")) return true;

  return false;
}

function isRetryableAppError(err: any): boolean {
  if (!(err instanceof AppError)) return false;

  // HTTP error vindo do Omie: retry apenas para 5xx e 429
  if (err.code === "OMIE_HTTP_ERROR") {
    const httpStatus = Number((err.details as any)?.httpStatus ?? 0);
    const sample = String((err.details as any)?.sample ?? "");
    const sampleLower = sample.toLowerCase();
    if (sampleLower.includes("redundant") || sampleLower.includes("consumo redundante")) {
      return false;
    }
    return httpStatus >= 500 || httpStatus === 429;
  }

  // Falha de rede: retryável
  if (err.code === "OMIE_NETWORK_ERROR") return true;

  // Parse error normalmente não é transitório (não retry)
  return false;
}

export class OmieClient {
  private readonly timeoutMs: number;
  private readonly retryAttempts: number;
  private readonly retryBaseDelayMs: number;
  private readonly retryMaxDelayMs: number;

  constructor(
    private readonly config: OmieClientConfig,
    private readonly logger: OmieLogger = {}
  ) {
    this.timeoutMs = Number.isFinite(config.timeoutMs as number)
      ? Number(config.timeoutMs)
      : 20_000;

    const retryCfg = config.retry ?? {};
    this.retryAttempts = Number.isFinite(retryCfg.attempts as number)
      ? Math.max(1, Number(retryCfg.attempts))
      : 3; // total 3 tentativas (1 + 2 retries)

    this.retryBaseDelayMs = Number.isFinite(retryCfg.baseDelayMs as number)
      ? Math.max(0, Number(retryCfg.baseDelayMs))
      : 250;

    this.retryMaxDelayMs = Number.isFinite(retryCfg.maxDelayMs as number)
      ? Math.max(this.retryBaseDelayMs, Number(retryCfg.maxDelayMs))
      : 6_000;
  }

  async post<T>(path: string, payload: any): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();

    // nunca logar appSecret
    const body = {
      ...payload,
      app_key: this.config.appKey,
      app_secret: this.config.appSecret,
    };

    const call = payload?.call ?? body?.call;

    if (this.config.debug && process.env.NODE_ENV !== "production") {
      this.logger.info?.({ scope: "omie", url, call }, "[OMIE] request");
    }

    let lastErr: any = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const text = await response.text();

        if (!response.ok) {
          throw new AppError("OMIE_HTTP_ERROR", 502, "Omie retornou erro HTTP", {
            httpStatus: response.status,
            url,
            call,
            sample: text?.slice?.(0, 1500),
          });
        }

        try {
          return JSON.parse(text) as T;
        } catch {
          throw new AppError("OMIE_PARSE_ERROR", 502, "Resposta do Omie não é JSON válido", {
            url,
            call,
            sample: text.slice(0, 500),
          });
        }
      } catch (err: any) {
        clearTimeout(timeoutId);

        // Normaliza erros não-AppError de rede/timeout
        if (!(err instanceof AppError)) {
          err = new AppError(
            "OMIE_NETWORK_ERROR",
            502,
            "Falha de rede/timeout ao chamar Omie",
            {
              url,
              call,
              message: err?.message,
              name: err?.name,
            }
          );
        }

        lastErr = err;

        const retryable =
          isRetryableAppError(err) ||
          isLikelyTransientNetworkError(err);

        const hasMoreAttempts = attempt < this.retryAttempts;

        if (retryable && hasMoreAttempts) {
          const backoff = clamp(
            this.retryBaseDelayMs * Math.pow(2, attempt - 1),
            this.retryBaseDelayMs,
            this.retryMaxDelayMs
          );

          const delay = withJitter(backoff);

          this.logger.warn?.(
            { scope: "omie", url, call, attempt, nextAttemptInMs: delay, code: err.code },
            "[OMIE] retrying request"
          );

          await sleep(delay);
          continue;
        }

        // Sem retry -> lança o último erro
        throw err;
      }
    }

    // fallback (não deveria chegar aqui)
    throw lastErr ?? new AppError("OMIE_NETWORK_ERROR", 502, "Falha ao chamar Omie", {
      url,
      call: payload?.call,
    });
  }
}

/**
 * Factory
 */
export function createOmieClient(config: OmieClientConfig, logger?: OmieLogger) {
  return new OmieClient(config, logger);
}

