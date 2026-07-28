// ---------------------------------------------------------------------------
// Mapper: map-omie-stock-to-domain
// Mapeia os dados crus do Omie para o formato de domínio interno.
// ---------------------------------------------------------------------------

import type { ProductStockExternalItem } from "../ports/product-stock-fetch.gateway";

/**
 * Extrai quantidade do item de estoque de forma defensiva
 * (Omie pode usar chaves diferentes por conta/ambiente).
 */
export function extractQuantity(item: any): number {
    const candidates = [
        item?.nSaldo,
        item?.nQtde,
        item?.nQuantidade,
        item?.nQtd,
        item?.nQtdEstoque,
        item?.nEstoque,
        item?.quantidade,
        item?.saldo,
    ];

    for (const c of candidates) {
        if (c === null || c === undefined) continue;
        const num = typeof c === "number" ? c : Number(String(c).replace(",", "."));
        if (!Number.isNaN(num)) return num;
    }

    return 0;
}

/**
 * Extrai o código do produto do item, testando várias chaves possíveis.
 */
export function extractProductCode(item: any): string | null {
    const candidate =
        item?.nCodProd ??
        item?.nCodProduto ??
        item?.codigo_produto ??
        item?.codigo ??
        item?.cCodigo ??
        null;
    return candidate !== null ? String(candidate) : null;
}

/**
 * Extrai o código do local de estoque.
 */
export function extractStockLocationCode(item: any): number {
    const code = Number(
        item?.codigo_local_estoque ?? item?.codigo_local ?? item?.nCodLocal ?? 0
    );
    return Number.isNaN(code) ? 0 : code;
}

/**
 * Mapeia um item bruto do Omie para ProductStockExternalItem.
 */
export function mapOmieItemToStockItem(item: any): ProductStockExternalItem | null {
    const productId = extractProductCode(item);
    if (!productId) return null;

    return {
        productId,
        stockLocationCode: extractStockLocationCode(item),
        quantity: extractQuantity(item),
    };
}
