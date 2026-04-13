# Production Manager API

A API do **Gerenciador de Produção** é um serviço backend desenvolvido para gerenciar o planejamento de produção industrial, integrando-se diretamente ao ERP **Omie**. A API permite sincronizar produtos e estoques do ERP, organizá-los em setores produtivos e criar planos de produção detalhados, que podem ser exportados.

**URL Base de Produção:** [https://production-manager-api.onrender.com/](https://production-manager-api.onrender.com/)

---

## 🛠️ Tecnologias Utilizadas

- **Node.js (v20)** com **TypeScript**
- **Fastify**: Framework web de alta performance.
- **Prisma ORM**: Modelagem de dados e migrações.
- **PostgreSQL**: Banco de dados relacional.
- **Zod**: Validação de esquemas e dados de entrada.
- **Vitest**: Framework para testes unitários.

---

## 🏗️ Estrutura do Banco de Dados

O banco de dados é modelado utilizando Prisma (`schema.prisma`) e possui as seguintes entidades principais:
- **OmieProduct**: Espelho dos produtos vindos do ERP Omie.
- **Product**: Produtos ativamente gerenciados pelo sistema.
- **Sector**: Setores de produção (ex: Corte, Costura, Acabamento) com ordenação configurável.
- **ProductSector**: Relacionamento que define o setor padrão de um produto.
- **ProductionPlan**: Planos de produção com datas de início/fim e status (DRAFT, PUBLISHED, CLOSED).
- **ProductionPlanItem**: Itens (produtos e quantidades) vinculados a um plano e setor específicos.

---

## 🚀 Rotas da API

Abaixo estão listadas as rotas disponíveis na aplicação, organizadas por contexto. As rotas versionadas usam o prefixo `/v1/*`.

### Rotas Informativas (DX)
- `GET /`: Retorna um JSON informativo (nome, versão, timestamp, links úteis e dicas).
- `GET /health`: Healthcheck simples (`{ ok: true }`).
- `GET /v1`: Índice manual de rotas v1 para facilitar uso via browser.

### Health Check
- `GET /health`: Retorna o status da aplicação (`{ ok: true }`).

### 🔄 Integração Omie
Sincroniza e consulta produtos e estoques diretamente do ERP Omie.
- `POST /v1/omie/sync/products`: Sincroniza o catálogo de produtos do Omie. Aceita o parâmetro de query `?force=true`.
- `POST /v1/omie/products/stock/refresh`: Força a atualização do cache de estoque dos produtos.
- `GET /v1/omie/products`: Lista os produtos sincronizados com o Omie. Suporta paginação (`page`, `pageSize`), e filtros (`search`, `family`).

### 🏭 Setores (Sectors)
Gerencia os setores pelos quais os produtos passam na produção.
- `POST /v1/sectors`: Cria um novo setor (nome e ordem).
- `GET /v1/sectors`: Lista todos os setores ordenados. Aceita `?includeInactive=true`.
- `PATCH /v1/sectors/:id`: Atualiza dados de um setor específico.
- `DELETE /v1/sectors/:id`: Realiza o "soft delete" (desativa) de um setor.

### 📦 Produtos Gerenciados (Products)
Gerencia quais produtos do Omie serão ativamente monitorados pelo Gerenciador de Produção.
- `POST /v1/products`: Importa um produto específico do Omie para o gerenciador.
- `POST /v1/products/bulk`: Importa vários produtos do Omie em lote.
- `GET /v1/products`: Lista os produtos gerenciados, incluindo seus setores vinculados.
- `DELETE /v1/products/:id`: Remove um produto do gerenciador.

### 🔗 Mapeamento Produto-Setor
Define em qual setor um determinado produto deve ser fabricado.
- `PUT /v1/products/:productId/sector`: Associa um produto a um setor padrão.
- `GET /v1/products/:productId/sector`: Retorna o setor vinculado a um produto específico.

### 📋 Planos de Produção (Plans)
Gerencia o planejamento de produção, definindo quantidades e períodos.
- `POST /v1/plans`: Cria um novo plano de produção.
- `GET /v1/plans`: Lista os planos criados.
- `GET /v1/plans/:id`: Retorna os detalhes de um plano, incluindo seus itens.
- `POST /v1/plans/:id/items`: Adiciona um item (produto, setor, quantidade) ao plano.
- `GET /v1/plans/:id/by-sector`: Retorna os itens de um plano agrupados de forma ordenada por setor.
- `GET /v1/plans/:id/export.csv`: Exporta o plano de produção em formato CSV.

---

## 💻 Scripts Disponíveis

No arquivo `package.json`, estão definidos os seguintes scripts principais:

- `pnpm run dev`: Inicia o servidor em modo de desenvolvimento usando `tsx` com watch mode.
- `pnpm run build`: Compila o código TypeScript para JavaScript (pasta `dist/`).
- `pnpm run start`: Executa as migrações no banco de dados (`db:migrate:prod`) e inicia a versão compilada.
- `pnpm run db:migrate`: Gera e aplica migrações no ambiente de desenvolvimento.
- `pnpm run prisma:generate`: Gera os artefatos do Prisma Client.
- `pnpm run test`: Executa a suíte de testes automatizados com Vitest.

---

## 🔎 Testes rápidos (curl)

Produção (base URL: https://production-manager-api.onrender.com):

- `GET /`
```bash
curl -i https://production-manager-api.onrender.com/
```

- `GET /health`
```bash
curl -i https://production-manager-api.onrender.com/health
```

- `GET /v1`
```bash
curl -i https://production-manager-api.onrender.com/v1
```

- `POST /v1/omie/sync/products` (ação)
```bash
curl -i -X POST "https://production-manager-api.onrender.com/v1/omie/sync/products?force=true"
```

- `GET /v1/omie/products` (leitura)
```bash
curl -i "https://production-manager-api.onrender.com/v1/omie/products?page=1&pageSize=50"
```
