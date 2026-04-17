import { env } from '../../env';
import { AppError } from '../../core/errors/AppError';

export class OmieClient {
  private TIMEOUT_MS = 20000;

  async post<T>(path: string, payload: any): Promise<T> {
    const url = new URL(path, env.OMIE_BASE_URL).toString();

    const body = {
      ...payload,
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
    };
    if (process.env.NODE_ENV !== 'production') {
      console.log('[OMIE] URL:', url);
      console.log('[OMIE] CALL:', body.call);
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const text = await response.text();

      if (!response.ok) {
        throw new AppError(
          'OMIE_HTTP_ERROR',
          502,
          'Omie retornou erro HTTP',
          { httpStatus: response.status, body: text }
        );
      }

      try {
        const parsed = JSON.parse(text);
        return parsed as T;
      } catch (err: any) {
        throw new AppError(
          'OMIE_PARSE_ERROR',
          502,
          'Resposta do Omie não é JSON válido',
          { sample: text.slice(0, 500) }
        );
      }
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err instanceof AppError) {
        throw err;
      }

      throw new AppError(
        'OMIE_NETWORK_ERROR',
        502,
        'Falha de rede/timeout ao chamar Omie',
        { message: err.message }
      );
    }
  }
}

export const omieClient = new OmieClient();
