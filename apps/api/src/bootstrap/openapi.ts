import type { FastifyInstance } from "fastify";

export function registerOpenAPIDocumentation(app: FastifyInstance) {
  // Configuração do OpenAPI/Swagger
  app.register(import("@fastify/swagger"), {
    openapi: {
      info: {
        title: "Production Manager API - Fase 2 (API Core)",
        description: `
# Production Manager API - Fase 2

Esta é a API Core do sistema de gestão de produção, desenvolvida com estratégia **API-FIRST**.

## 📋 Funcionalidades Implementadas

### 1. Sistema de Sincronização
- **POST /api/sync/stock**: Sincroniza estoque com fonte externa (Omie)
- **POST /api/sync/orders**: Sincroniza pedidos de venda
- **GET /api/sync/status**: Status das últimas sincronizações
- **GET /api/sync/health**: Health check do módulo de sincronização

### 2. Sistema de Alertas de Estoque
- **GET /api/alerts/stock**: Listar alertas de estoque com filtros
- **GET /api/alerts/stock/critical**: Listar alertas críticos de estoque
- **POST /api/alerts/stock/configure**: Configurar regras de alertas
- **PATCH /api/alerts/stock/:id/status**: Atualizar status de um alerta
- **GET /api/alerts/stock/statistics**: Estatísticas de alertas

### 3. Fila de Produção
- **POST /api/production/queue/add**: Adicionar ordem à fila de produção
- **GET /api/production/queue**: Listar itens da fila com filtros
- **PATCH /api/production/queue/:id/status**: Atualizar status de um item
- **GET /api/production/queue/statistics**: Estatísticas da fila
- **POST /api/production/queue/reorder**: Reordenar a fila

### 4. Integração Automática Vendas→Produção
- **POST /api/integration/sales-to-production**: Integrar pedido automaticamente
- **GET /api/integration/sales-to-production/statistics**: Estatísticas da integração

## 🎯 Regras de Negócio

### Prioridade na Fila de Produção
1. **Alta Prioridade (high)**:
   - Clientes VIP
   - Pedidos com valor > R$ 10.000
   - Pedidos com prazo de entrega < 48h

2. **Média Prioridade (medium)**:
   - Clientes corporativos
   - Pedidos com valor entre R$ 1.000 e R$ 10.000
   - Pedidos com prazo de entrega entre 48h e 7 dias

3. **Baixa Prioridade (low)**:
   - Clientes regulares
   - Pedidos com valor < R$ 1.000
   - Pedidos com prazo de entrega > 7 dias

### Alertas de Estoque
- **Crítico**: Estoque abaixo de 10% do mínimo
- **Atenção**: Estoque abaixo do mínimo
- **Normal**: Estoque acima do mínimo

## 🔧 Tecnologias
- **Framework**: Fastify
- **Banco de Dados**: PostgreSQL com Prisma ORM
- **Validação**: Zod
- **Cache**: Redis (multi-nível)
- **Documentação**: OpenAPI 3.0

## 📊 Polling Inteligente
- **Estoque**: 2 minutos (intervalo adaptativo)
- **Pedidos**: 1 minuto (baseado em criticidade)
- **Produção**: 30 segundos (tempo real)

## 🔒 Autenticação
- API Key via header \`X-API-Key\`
- JWT para endpoints administrativos

## 🚀 Deploy
- **Ambiente**: Docker + Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoramento**: Prometheus + Grafana

## 📞 Suporte
- **Documentação**: [docs.production-manager.com](https://docs.production-manager.com)
- **Suporte**: support@production-manager.com
- **Status**: [status.production-manager.com](https://status.production-manager.com)
        `,
        version: "2.0.0",
        contact: {
          name: "Equipe de Desenvolvimento",
          email: "dev@production-manager.com",
          url: "https://production-manager.com",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/MIT",
        },
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Ambiente de desenvolvimento local",
        },
        {
          url: "https://api.staging.production-manager.com",
          description: "Ambiente de staging",
        },
        {
          url: "https://api.production-manager.com",
          description: "Ambiente de produção",
        },
      ],
      tags: [
        {
          name: "sync",
          description: "Endpoints de sincronização com sistemas externos",
        },
        {
          name: "alerts",
          description: "Sistema de alertas de estoque crítico",
        },
        {
          name: "production-queue",
          description: "Gestão da fila de produção",
        },
        {
          name: "sales-production-integration",
          description: "Integração automática vendas→produção",
        },
      ],
      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "X-API-Key",
            in: "header",
            description: "API Key para autenticação",
          },
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
            description: "JWT para autenticação administrativa",
          },
        },
      },
    },
  });

  // Configuração da UI Swagger
  app.register(import("@fastify/swagger-ui"), {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Endpoint para download da especificação OpenAPI
  app.get("/openapi.json", {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    const openapi = app.swagger();
    return openapi;
  });

  // Endpoint para download da especificação OpenAPI em YAML
  app.get("/openapi.yaml", {
    schema: {
      hide: true,
    },
  }, async (request, reply) => {
    const openapi = app.swagger({ yaml: true });
    reply.type("application/yaml");
    return openapi;
  });
}