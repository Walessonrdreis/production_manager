/**
 * Schemas Fastify (JSON Schema).
 * Mantém contratos explícitos e previsíveis.
 */

export const SyncProductStructureBodySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string", minLength: 1 },
    idProduto: { type: "number" },
    intProduto: { type: "string", minLength: 1 },
  },
} as const;

export const SyncProductStructureResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string" },
    hasStructure: { type: "boolean" },
    updated: { type: "boolean" },
    itemsCount: { type: "number" },
  },
  required: ["codProduto", "hasStructure", "updated", "itemsCount"],
} as const;

export const GetProductStructureParamsSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string", minLength: 1 },
  },
  required: ["codProduto"],
} as const;

export const ProductStructureOutputSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    codProduto: { type: "string" },
    descrProduto: { type: ["string", "null"] },
    codFamilia: { type: ["string", "null"] },
    descrFamilia: { type: ["string", "null"] },
    tipoProduto: { type: ["string", "null"] },
    unidProduto: { type: ["string", "null"] },
    pesoBruto: { type: ["number", "null"] },
    pesoLiquido: { type: ["number", "null"] },
    hasStructure: { type: "boolean" },

    idProdutoOmie: { type: ["number", "null"] },
    intProdutoOmie: { type: ["string", "null"] },

    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          codProdutoComponente: { type: "string" },
          descrProdutoComponente: { type: ["string", "null"] },
          codFamiliaComponente: { type: ["string", "null"] },
          descrFamiliaComponente: { type: ["string", "null"] },
          quantidade: { type: "number" },
          unidade: { type: ["string", "null"] },
          tipoProdutoComponente: { type: ["string", "null"] },
          percentualPerda: { type: ["number", "null"] },
          idMalhaOmie: { type: ["number", "null"] },
        },
        required: ["codProdutoComponente", "quantidade"],
      },
    },

    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
  required: ["codProduto", "hasStructure", "items", "createdAt", "updatedAt"],
} as const;

export const ListProductStructuresQuerySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    page: { type: "string", pattern: "^[0-9]+$" },
    pageSize: { type: "string", pattern: "^[0-9]+$" },
    hasStructure: { type: "string", enum: ["true", "false"] },
    q: { type: "string" },
  },
} as const;

export const ListProductStructuresResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    data: {
      type: "array",
      items: ProductStructureOutputSchema,
    },
    meta: {
      type: "object",
      additionalProperties: false,
      properties: {
        page: { type: "number" },
        pageSize: { type: "number" },
        total: { type: "number" },
        totalPages: { type: "number" },
      },
      required: ["page", "pageSize", "total", "totalPages"],
    },
  },
  required: ["data", "meta"],
} as const;