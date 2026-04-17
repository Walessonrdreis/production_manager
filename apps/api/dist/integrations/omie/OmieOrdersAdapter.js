"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEligibleStage20 = isEligibleStage20;
exports.mapOrder = mapOrder;
// src/integrations/omie/OmieOrdersAdapter.ts// src/integrations/omie pedidos Omie:
/*
* - etapa === "20"
 * - não cancelado (infoCadastro.cancelado !== "S")
 * - não encerrado (cabecalho.encerrado !== "S")
 * - fallback: se cabecalho.enc_data tiver valor, considera encerrado
 */
function isEligibleStage20(pedido) {
    const cab = pedido?.cabecalho ?? {};
    const cad = pedido?.infoCadastro ?? {};
    if (String(cab.etapa ?? '').trim() !== '20')
        return false;
    if ((0, omieUtils_1.isSim)(cad.cancelado))
        return false;
    if ((0, omieUtils_1.isSim)(cab.encerrado))
        return false;
    // fallback de encerramento
    if (String(cab.enc_data ?? '').trim())
        return false;
    return true;
}
/**
 * Mapeia pedido Omie -> estrutura para persistir no Prisma
 * (usando chaves Omie como String, igual seu padrão em OmieProduct/ProductStock)
 */
function mapOrder(pedido) {
    const cab = pedido?.cabecalho ?? {};
    const cad = pedido?.infoCadastro ?? {};
    const order = {
        omieCode: String(cab.codigo_pedido),
        numeroPedido: cab.numero_pedido ? String(cab.numero_pedido) : null,
        codigoCliente: cab.codigo_cliente ? String(cab.codigo_cliente) : null,
        codigoEmpresa: cab.codigo_empresa ? String(cab.codigo_empresa) : null,
        etapa: String(cab.etapa ?? '').trim(),
        cancelado: String(cad.cancelado ?? 'N').trim() || 'N',
        encerrado: String(cab.encerrado ?? 'N').trim() || 'N',
        dataPrevisao: (0, omieUtils_1.brDateToISO)(cab.data_previsao),
        dCan: (0, omieUtils_1.brDateToISO)(cad.dCan),
        hCan: cad.hCan ?? null,
        dInc: (0, omieUtils_1.brDateToISO)(cad.dInc),
        hInc: cad.hInc ?? null,
        uInc: cad.uInc ?? null,
        dAlt: (0, omieUtils_1.brDateToISO)(cad.dAlt),
        hAlt: cad.hAlt ?? null,
        uAlt: cad.uAlt ?? null,
        quantidadeItens: cab.quantidade_itens ?? null,
        rawPayload: pedido,
        lastSyncAt: new Date(),
    };
    const items = (pedido?.det ?? []).map((d) => {
        const prod = d?.produto ?? {};
        const ide = d?.ide ?? {};
        return {
            omieItemCode: String(ide.codigo_item),
            omieProductCode: prod.codigo_produto ? String(prod.codigo_produto) : null,
            sku: prod.codigo ?? null,
            description: String(prod.descricao ?? '').trim(),
            unit: prod.unidade ?? null,
            // Prisma Decimal aceita string
            quantity: String(prod.quantidade ?? 0),
            unitPrice: prod.valor_unitario != null ? String(prod.valor_unitario) : null,
            totalPrice: prod.valor_total != null ? String(prod.valor_total) : null,
            rawPayload: d,
            lastSyncAt: new Date(),
        };
    });
    return { order, items };
}
``;
const omieUtils_1 = require("./omieUtils");
