export type OmieClientConfig = {
  baseUrl: string; // ex: https://app.omie.com.br
  timeoutMs?: number; // default 15000
  headers?: Record<string, string>; // auth, etc (flexível)
};

export class OmieClient {
  constructor(private config: OmieClientConfig) {
    if (!config?.baseUrl) {
      throw new Error("OmieClientConfig.baseUrl é obrigatório");
    }
  }

  async post<TResponse>(path: string, body: unknown): Promise<TResponse> {
    const url = this.config.baseUrl.replace(/\/+$/, "") + path;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15000);

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(this.config.headers ?? {}),
        },
        body: JSON.stringify(body ?? {}),
        signal: controller.signal,
      });

      const text = await res.text();
      let json: any;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        json = { raw: text };
      }

      if (!res.ok) {
        const err = new Error(`Falha Omie HTTP ${res.status} em ${path}`);
        (err as any).code = "OMIE_HTTP_ERROR";
        (err as any).statusCode = res.status;
        (err as any).details = json;
        throw err;
      }

      return json as TResponse;
    } finally {
      clearTimeout(timeout);
    }
  }
}