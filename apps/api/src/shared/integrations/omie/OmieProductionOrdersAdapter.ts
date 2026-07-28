// src/shared/integrations/omie/OmieProductionOrdersAdapter.ts

import { brDateToISO, isSim } from './omie.utils'

export interface OmieProductionOrder {
  omieId: string
  internalCode?: string | null
  orderNumber?: string | null
  productCode?: string | null
  productIntegrationCode?: string | null
  quantity: string
  forecastDate?: string | null
  startDate?: string | null
  completionDate?: string | null
  stage?: string | null
  projectCode?: string | null
  completed: boolean
  rawPayload: any
  lastSyncAt: Date
}

export interface OmieProductionOrderItem {
  omieItemCode: string
  omieProductionOrderId: string
  productMeshId?: number | null
  useFromStock?: string | null
  quantity?: string | null
  stockLocationCode?: number | null
  observation?: string | null
  rawPayload: any
  lastSyncAt: Date
}

/**
 * Filtra ordens de produção por status de conclusão
 * Útil para buscar ordens em andamento ou concluídas
 */
export function filterByCompletionStatus(order: any, completed: boolean): boolean {
  const outrasInf = order?.outrasInf ?? {}
  const cConcluida = String(outrasInf.cConcluida ?? '').trim()

  if (completed) {
    return cConcluida === 'S'
  } else {
    return cConcluida !== 'S'
  }
}

/**
 * Filtra ordens de produção por data de conclusão
 */
export function filterByCompletionDate(order: any, startDate?: string, endDate?: string): boolean {
  const outrasInf = order?.outrasInf ?? {}
  const completionDate = outrasInf.dConclusao

  if (!completionDate) return false

  const date = brDateToISO(completionDate)
  if (!date) return false

  if (startDate && date < new Date(startDate)) return false
  if (endDate && date > new Date(endDate)) return false

  return true
}

/**
 * Mapeia ordem de produção Omie -> estrutura para persistir no Prisma
 */
export function mapProductionOrder(order: any): {
  order: OmieProductionOrder
  items: OmieProductionOrderItem[]
} {
  const identificacao = order?.identificacao ?? {}
  const infAdicionais = order?.infAdicionais ?? {}
  const outrasInf = order?.outrasInf ?? {}

  const omieId = String(identificacao.nCodOP ?? '')
  const internalCode = identificacao.cCodIntOP ? String(identificacao.cCodIntOP) : null
  const orderNumber = identificacao.cNumOP ? String(identificacao.cNumOP) : null

  const mappedOrder: OmieProductionOrder = {
    omieId,
    internalCode,
    orderNumber,
    productCode: identificacao.nCodProduto ? String(identificacao.nCodProduto) : null,
    productIntegrationCode: identificacao.cCodIntProd ? String(identificacao.cCodIntProd) : null,
    quantity: String(identificacao.nQtde ?? 0),
    forecastDate: brDateToISO(identificacao.dDtPrevisao)?.toISOString() || null,
    startDate: brDateToISO(infAdicionais.dDtInicio)?.toISOString() || null,
    completionDate: brDateToISO(infAdicionais.dDtConclusao)?.toISOString() || null,
    stage: infAdicionais.cEtapa ? String(infAdicionais.cEtapa) : null,
    projectCode: infAdicionais.nCodProjeto ? String(infAdicionais.nCodProjeto) : null,
    completed: String(outrasInf.cConcluida ?? '').trim() === 'S',
    rawPayload: order,
    lastSyncAt: new Date(),
  }

  const items: OmieProductionOrderItem[] = []

  // Processar itens principais
  const mainItems = order?.itens ?? []
  mainItems.forEach((item: any) => {
    const omieItemCode = `main_${item.nIdProdutoMalha ?? Date.now()}`

    items.push({
      omieItemCode,
      omieProductionOrderId: omieId,
      productMeshId: item.nIdProdutoMalha ?? null,
      useFromStock: item.cUtilizarDoEstoque ?? null,
      rawPayload: item,
      lastSyncAt: new Date(),
    })
  })

  // Processar itens detalhados (se disponíveis)
  const detailedItems = order?.itensDetalhes ?? []
  detailedItems.forEach((item: any, index: number) => {
    const omieItemCode = `detail_${item.nIdProdutoMalha ?? index}`

    items.push({
      omieItemCode,
      omieProductionOrderId: omieId,
      productMeshId: item.nIdProdutoMalha ?? null,
      useFromStock: item.cUtilizarDoEstoque ?? null,
      quantity: item.nQtde != null ? String(item.nQtde) : null,
      stockLocationCode: item.codigo_local_estoque ?? null,
      observation: item.cObs ?? null,
      rawPayload: item,
      lastSyncAt: new Date(),
    })
  })

  return { order: mappedOrder, items }
}

/**
 * Extrai informações resumidas da ordem de produção para exibição
 */
export function extractProductionOrderSummary(order: any) {
  const identificacao = order?.identificacao ?? {}
  const infAdicionais = order?.infAdicionais ?? {}
  const outrasInf = order?.outrasInf ?? {}

  return {
    omieId: String(identificacao.nCodOP ?? ''),
    internalCode: identificacao.cCodIntOP ? String(identificacao.cCodIntOP) : null,
    orderNumber: outrasInf.cNumOP ? String(outrasInf.cNumOP) : null,
    productCode: identificacao.nCodProduto ? String(identificacao.nCodProduto) : null,
    quantity: String(identificacao.nQtde ?? 0),
    forecastDate: brDateToISO(identificacao.dDtPrevisao),
    stage: infAdicionais.cEtapa ? String(infAdicionais.cEtapa) : null,
    completed: String(outrasInf.cConcluida ?? '').trim() === 'S',
    completionDate: brDateToISO(outrasInf.dConclusao),
  }
}