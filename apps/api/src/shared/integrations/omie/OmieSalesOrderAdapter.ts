// ---------------------------------------------------------------------------
// OmieSalesOrderAdapter
// ---------------------------------------------------------------------------
// Adapter compartilhado para mapear payloads de pedidos de venda do Omie
// (produtos/pedido/ → ListarPedidos) para o formato interno consistente.
//
// Reúne tipos, helpers de parsing e funções de mapeamento para evitar
// duplicação entre gateways reais e fakes.
// ---------------------------------------------------------------------------

import { brDateToISO } from "./omie.utils";

// ─── Tipos do Payload Omie ────────────────────────────────────────────

export type OmieYesNo = "S" | "N" | "";

export interface OmieCabecalho {
    bloqueado?: OmieYesNo;
    codigo_cliente?: number | string;
    codigo_empresa?: number | string;
    codigo_pedido?: number | string;
    data_previsao?: string;
    encerrado?: OmieYesNo;
    etapa?: string;
    numero_pedido?: number | string;
}

export interface OmieInfoCadastro {
    cancelado?: OmieYesNo;
    dAlt?: string;
    hAlt?: string;
    faturado?: OmieYesNo;
}

export interface OmieTotalPedido {
    valor_total_pedido?: number | string;
}

export interface OmieDetIde {
    codigo_item?: number | string;
}

export interface OmieDetProduto {
    codigo?: string;
    codigo_produto?: number | string;
    descricao?: string;
    unidade?: string;
    quantidade?: number | string;
    valor_unitario?: number | string;
    valor_total?: number | string;
}

export interface OmieDet {
    ide?: OmieDetIde;
    produto?: OmieDetProduto;
}

export interface OmiePedidoVendaProduto {
    cabecalho?: OmieCabecalho;
    infoCadastro?: OmieInfoCadastro;
    total_pedido?: OmieTotalPedido;
    det?: OmieDet[];
}

export interface OmieListarPedidosResponse {
    pagina?: number | string;
    total_de_paginas?: number | string;
    pedido_venda_produto?: OmiePedidoVendaProduto[];
}

// ─── Helpers de Parsing ───────────────────────────────────────────────

/**
 * Converte data/hora Omie (formato BR) para Date.
 * Ex: parseOmieDateTime("14/04/2026", "15:30:00") → Date
 */
export function parseOmieDateTime(
    dateStr?: string | null,
    timeStr?: string | null
): Date | null {
    if (!dateStr || !timeStr) return null;

    const date = brDateToISO(dateStr);
    if (!date) return null;

    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    if (!Number.isFinite(hours)) return null;

    date.setUTCHours(hours ?? 0, minutes ?? 0, seconds ?? 0, 0);
    return date;
}

/**
 * Converte valor para string ou null.
 */
export function toNullableString(value: unknown): string | null {
    if (value == null) return null;

    const result = String(value).trim();
    return result.length > 0 ? result : null;
}

/**
 * Converte valor para número ou null.
 */
export function toNullableNumber(value: unknown): number | null {
    if (value == null || value === "") return null;

    const result = Number(value);
    return Number.isFinite(result) ? result : null;
}

// ─── Tipos Mapeados (output do adapter) ────────────────────────────────

export interface MappedSalesOrderItem {
    omieItemId: string;
    productCode: string;
    productOmieId: string;
    description: string;
    unit: string | null;
    quantity: number;
    unitPrice: number | null;
    totalPrice: number | null;
    rawPayload: unknown;
}

export interface MappedSalesOrder {
    omieId: string;
    orderNumber: string | null;
    stage: string;
    isCanceled: boolean;
    isClosed: boolean;
    customerOmieId: string | null;
    companyOmieId: string | null;
    forecastDate: Date | null;
    totalAmount: number | null;
    updatedAt: Date | null;
    rawPayload: unknown;
    items: MappedSalesOrderItem[];
}

// ─── Função de Mapeamento ─────────────────────────────────────────────

/**
 * Mapeia um pedido de venda do payload Omie para o formato interno.
 * Retorna null se o pedido não tiver cabeçalho (inválido).
 */
export function mapSalesOrder(
    pedido: OmiePedidoVendaProduto
): MappedSalesOrder | null {
    const cabecalho = pedido.cabecalho;
    const infoCadastro = pedido.infoCadastro;
    const totalPedido = pedido.total_pedido;

    if (!cabecalho) {
        return null;
    }

    const updatedAt = parseOmieDateTime(
        infoCadastro?.dAlt,
        infoCadastro?.hAlt
    );

    const detalhes = Array.isArray(pedido.det) ? pedido.det : [];

    return {
        omieId: String(cabecalho.codigo_pedido ?? ""),
        orderNumber: toNullableString(cabecalho.numero_pedido),
        stage: String(cabecalho.etapa ?? ""),
        isCanceled: infoCadastro?.cancelado === "S",
        isClosed:
            infoCadastro?.faturado === "S" || cabecalho.encerrado === "S",
        customerOmieId: toNullableString(cabecalho.codigo_cliente),
        companyOmieId: toNullableString(cabecalho.codigo_empresa),
        forecastDate: brDateToISO(cabecalho.data_previsao),
        totalAmount: toNullableNumber(totalPedido?.valor_total_pedido),
        updatedAt,
        rawPayload: pedido,
        items: detalhes.map(mapSalesOrderItem),
    };
}

/**
 * Mapeia um item de pedido do payload Omie para o formato interno.
 */
export function mapSalesOrderItem(item: OmieDet): MappedSalesOrderItem {
    const ide = item.ide;
    const produto = item.produto;

    return {
        omieItemId: String(ide?.codigo_item ?? ""),
        productCode: String(produto?.codigo ?? ""),
        productOmieId: String(produto?.codigo_produto ?? ""),
        description: String(produto?.descricao ?? ""),
        unit: toNullableString(produto?.unidade),
        quantity: Number(produto?.quantidade ?? 0),
        unitPrice: toNullableNumber(produto?.valor_unitario),
        totalPrice: toNullableNumber(produto?.valor_total),
        rawPayload: item,
    };
}

/**
 * Filtra pedidos mantidos (não cancelados, não encerrados)
 * com suporte a filtro incremental por updatedSince.
 */
export function isKeptSalesOrder(
    mapped: MappedSalesOrder | null,
    updatedSince?: Date
): mapped is MappedSalesOrder {
    if (!mapped) return false;
    if (mapped.isCanceled || mapped.isClosed) return false;
    if (updatedSince && mapped.updatedAt && mapped.updatedAt <= updatedSince)
        return false;
    return true;
}
