export const apiClient = {
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333',

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    return response.json();
  },

  async post<T>(path: string, body?: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    return response.json();
  },

  async put<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    return response.json();
  },

  async patch<T>(path: string, body: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    return response.json();
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }
    return response.json();
  },
};
