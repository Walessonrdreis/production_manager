// src/shared/integrations/omie/omie.client.ts
import { AppError } from "@/shared/errors/AppError";

export type OmieClientConfig = {
  baseUrl: string;
  appKey: string;
  appSecret: string;
  timeoutMs?: number;
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

export class OmieClient {
  private readonly timeoutMs: number;

  constructor(
    private readonly config: OmieClientConfig,
    private readonly logger: OmieLogger = {}
  ) {
    this.timeoutMs = Number.isFinite(config.timeoutMs as number) ? Number(config.timeoutMs) : 20_000;
  }

  async post<T>(path: string, payload: any): Promise<T> {
    const url = new URL(path, this.config.baseUrl).toString();

    // nunca logar appSecret
    const body = {
      ...payload,
      app_key: this.config.appKey,
      app_secret: this.config.appSecret,
    };

    if (this.config.debug && process.env.NODE_ENV !== "production") {
      this.logger.info?.(
        { scope: "omie", url, call: payload?.call ?? body?.call },
        "[OMIE] request"
      );
    }

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
          call: payload?.call ?? body?.call,
          sample: text?.slice?.(0, 1500),
        });
      }

      try {
        return JSON.parse(text) as T;
      } catch {
        throw new AppError("OMIE_PARSE_ERROR", 502, "Resposta do Omie não é JSON válido", {
          url,
          call: payload?.call ?? body?.call,
          sample: text.slice(0, 500),
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof AppError) throw err;

      // AbortError / timeout / falha de rede
      throw new AppError("OMIE_NETWORK_ERROR", 502, "Falha de rede/timeout ao chamar Omie", {
        url,
        call: payload?.call ?? payload?.call,
        message: err?.message,
        name: err?.name,
      });
    }
  }
}

/**
 * Factory opcional: facilita criar a partir de qualquer fonte de config.
 * (Ex.: app.env do Fastify plugin)
 */
export function createOmieClient(config: OmieClientConfig, logger?: OmieLogger) {
  return new OmieClient(config, logger);
}