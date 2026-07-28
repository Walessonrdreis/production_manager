import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/app';

describe('Informative Endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / - deve retornar JSON com informações da API', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    
    // Verifica estrutura principal do envelope de resposta (ok helper)
    expect(body).toHaveProperty('data');
    
    const data = body.data;
    expect(data.name).toBe('Production Manager API');
    expect(data.status).toBe('ok');
    expect(data.timestamp).toBeDefined();
    expect(data.versions).toHaveProperty('v1');
    expect(data.endpoints).toHaveProperty('health');
    expect(data.endpoints).toHaveProperty('indexV1');
    expect(data.endpoints).toHaveProperty('docs');
    expect(data.resources).toBeDefined();
    expect(Array.isArray(data.tips)).toBe(true);
  });

  it('GET /health - deve retornar ok: true', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    
    expect(body).toHaveProperty('data');
    expect(body.data).toEqual({ ok: true });
  });

  it('GET /v1 - deve retornar a lista de rotas v1', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/v1',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');

    const body = JSON.parse(response.payload);
    
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data.routes)).toBe(true);
    expect(Array.isArray(body.data.publicEndpoints)).toBe(true);
    expect(Array.isArray(body.data.adminEndpoints)).toBe(true);
    expect(Array.isArray(body.data.deprecatedEndpoints)).toBe(true);
    
    const firstRoute = body.data.routes[0];
    expect(firstRoute).toHaveProperty('method');
    expect(firstRoute).toHaveProperty('path');
    expect(firstRoute).toHaveProperty('description');
  });
});
