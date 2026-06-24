// ---------------------------------------------------------------------------
// Mapper — Product to Omie Payload
// ---------------------------------------------------------------------------
// Traduz os comandos do módulo product-manager para o payload
// esperado pela API Omie (IncluirProduto / AlterarProduto).
// ---------------------------------------------------------------------------

import { env } from "@/config";

type OmieProductPayload = {
    call: string;
    app_key: string;
    app_secret: string;
    param: Record<string, unknown>[];
};

export function buildCreateProductPayload(params: {
    externalRequestId: string;
    description: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
}): OmieProductPayload {
    const product: Record<string, unknown> = {
        codigo_produto_integracao: params.externalRequestId,
        descricao: params.description,
        descricao_familia: params.familyDescription,
        marca: params.brand,
        unidade: params.unit,
        ncm: params.ncm,
        ativo: "S",
    };

    if (params.sku) {
        product.codigo_produto_integracao = params.sku;
    }

    return {
        call: "IncluirProduto",
        app_key: env.OMIE_APP_KEY,
        app_secret: env.OMIE_APP_SECRET,
        param: [product],
    };
}

export function buildUpdateProductPayload(params: {
    externalRequestId: string;
    productCode: string;
    description?: string;
    sku?: string;
    familyDescription?: string;
    brand?: string;
    unit?: string;
    ncm?: string;
}): OmieProductPayload {
    const product: Record<string, unknown> = {
        codigo_produto: params.productCode,
        codigo_produto_integracao: params.externalRequestId,
    };

    if (params.description !== undefined) product.descricao = params.description;
    if (params.sku !== undefined) product.codigo_produto_integracao = params.sku;
    if (params.familyDescription !== undefined) product.descricao_familia = params.familyDescription;
    if (params.brand !== undefined) product.marca = params.brand;
    if (params.unit !== undefined) product.unidade = params.unit;
    if (params.ncm !== undefined) product.ncm = params.ncm;

    return {
        call: "AlterarProduto",
        app_key: env.OMIE_APP_KEY,
        app_secret: env.OMIE_APP_SECRET,
        param: [product],
    };
}

export function buildInactivateProductPayload(params: {
    externalRequestId: string;
    productCode: string;
}): OmieProductPayload {
    return {
        call: "AlterarProduto",
        app_key: env.OMIE_APP_KEY,
        app_secret: env.OMIE_APP_SECRET,
        param: [
            {
                codigo_produto: params.productCode,
                codigo_produto_integracao: params.externalRequestId,
                ativo: "N",
            },
        ],
    };
}
