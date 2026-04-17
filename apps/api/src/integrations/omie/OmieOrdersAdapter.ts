// src/integrations/omie/OmieOrdersAdapter.ts// src/integrations/omie pedidos Omie:
/*
* - etapa === "20"
 * - não cancelado (infoCadastro.cancelado !== "S")
 * - não encerrado (cabecalho.encerrado !== "S")
 * - fallback: se cabecalho.enc_data tiver valor, considera encerrado
 */
export function isEligibleStage20(pedido: any): boolean {
  const cab = pedido?.cabecalho ?? {}
  const cad = pedido?.infoCadastro ?? {}

  if (String(cab.etapa ?? '').trim() !== '20') return false
  if (isSim(cad.cancelado)) return false
  if (isSim(cab.encerrado)) return false

  // fallback de encerramento
  if (String(cab.enc_data ?? '').trim()) return false

  return true
}

/**
 * Mapeia pedido Omie -> estrutura para persistir no Prisma
 * (usando chaves Omie como String, igual seu padrão em OmieProduct/ProductStock)
 */
export function mapOrder(pedido: any) {
  const cab = pedido?.cabecalho ?? {}
  const cad = pedido?.infoCadastro ?? {}

  const order = {
    omieCode: String(cab.codigo_pedido),
    numeroPedido: cab.numero_pedido ? String(cab.numero_pedido) : null,
    codigoCliente: cab.codigo_cliente ? String(cab.codigo_cliente) : null,
    codigoEmpresa: cab.codigo_empresa ? String(cab.codigo_empresa) : null,

    etapa: String(cab.etapa ?? '').trim(),
    cancelado: String(cad.cancelado ?? 'N').trim() || 'N',
    encerrado: String(cab.encerrado ?? 'N').trim() || 'N',

    dataPrevisao: brDateToISO(cab.data_previsao),
    dCan: brDateToISO(cad.dCan),
    hCan: cad.hCan ?? null,

    dInc: brDateToISO(cad.dInc),
    hInc: cad.hInc ?? null,
    uInc: cad.uInc ?? null,

    dAlt: brDateToISO(cad.dAlt),
    hAlt: cad.hAlt ?? null,
    uAlt: cad.uAlt ?? null,

    quantidadeItens: cab.quantidade_itens ?? null,

    rawPayload: pedido,
    lastSyncAt: new Date(),
  }

  const items = (pedido?.det ?? []).map((d: any) => {
    const prod = d?.produto ?? {}
    const ide = d?.ide ?? {}

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
    }
  })

  return { order, items }
}
``
import { brDateToISO, isSim } from './omieUtils'


