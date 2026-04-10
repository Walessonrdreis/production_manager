export const apiClient = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333',

  async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';

    // Trata Erros
    if (!response.ok) {
      let code = 'ERROR';
      let message = response.statusText || 'Erro desconhecido';

      try {
        const text = await response.text();
        try {
          const payload = JSON.parse(text);
          if (payload.code) code = payload.code;
          if (payload.message) message = payload.message;
        } catch {
          if (text) {
            message = text;
          }
        }
      } catch {
        // Fallback
      }

      const errorMessage = `${code}: ${message}`;
      console.error(`[API Error] Status: ${response.status}, Message: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Sucesso - Verifica se o formato é CSV
    if (contentType.includes('text/csv')) {
      return response.text() as unknown as Promise<T>;
    }

    // Sucesso - JSON default
    return response.json();
  },

  async get<T>(path: string, customHeaders?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        ...customHeaders,
      },
    });
    
    return this.handleResponse<T>(response);
  },

  async post<T>(path: string, body?: any, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = { ...customHeaders };
    
    // Só define Content-Type se tiver body
    if (body !== undefined && body !== null) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
    });
    
    return this.handleResponse<T>(response);
  },

  async put<T>(path: string, body: any, customHeaders?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(body),
    });
    
    return this.handleResponse<T>(response);
  },

  async patch<T>(path: string, body: any, customHeaders?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...customHeaders,
      },
      body: JSON.stringify(body),
    });
    
    return this.handleResponse<T>(response);
  },

  async delete<T>(path: string, customHeaders?: Record<string, string>): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        ...customHeaders,
      },
    });
    
    return this.handleResponse<T>(response);
  },
};
