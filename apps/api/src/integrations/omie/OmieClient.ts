import { env } from '../../env';

export class OmieClient {
  async post<T>(path: string, payload: any): Promise<T> {
    // Constrói a URL baseada na env OMIE_BASE_URL
    const url = new URL(path, env.OMIE_BASE_URL).toString();

    // Injeta as credenciais no corpo da requisição
    const body = {
      ...payload,
      app_key: env.OMIE_APP_KEY,
      app_secret: env.OMIE_APP_SECRET,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Omie API Error [${response.status}]: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }
}

// Exporta uma instância singleton por conveniência
export const omieClient = new OmieClient();
