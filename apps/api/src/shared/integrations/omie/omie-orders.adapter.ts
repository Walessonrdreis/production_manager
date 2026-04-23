import { brDateToISO, isSim } from "@/shared/integrations/omie/omie.utils";

export type OmieOrderMapped = {
  order: {
    omieCode: string;
    numeroPedido: string | null;
    codigoCliente: string | null;
    codigoEmpresa: string | null;

    etapa: string;
    cancelado: string;
    encerrado: string;

    dataPrevisao: Date | null;
    dCan: Date | null;
    hCan: string | null;

    dInc: Date | null;
    hInc: string | null;
    uInc: string | null;

    dAlt: Date | null;
    hAlt: string | null;
    uAlt: string | null;

    quantidadeItens: unknown;

    rawPayload: unknown;
    lastSyncAt: Date;
  };
  items: Array<{
    omieItemCode: string;
    omieProductCode: string | null;
    sku: unknown;

    description: string;
    unit: unknown;

    quantity: string;
    unitPrice: string | null;
    totalPrice: string | null;

    rawPayload: unknown;
    lastSyncAt: Date;
  }>;
};

/**
 * Regras de elegibilidade para pedidos Omie:
 * - etapa === "20"
 * - não cancelado (infoCadastro.cancelado !== "S")
 * - não encerrado (cabecalho.encerrado !== "S")
 * - fallback: se cabecalho.enc_data tiver valor, considera encerrado
 */
export function isEligibleStage20(pedido: unknown): boolean {
  const p: any = pedido ?? {};
  const cab = p?.cabecalho ?? {};
  const cad = p?.infoCadastro ?? {};

  if (String(cab.etapa ?? "").trim() !== "20") return false;
  if (isSim(cad.cancelado)) return false;
  if (isSim(cab.encerrado)) return false;

  // fallback de encerramento
  if (String(cab.enc_data ?? "").trim()) return false;

  return true;
}

/**
 * Mapeia pedido Omie -> estrutura interna para persistência.
 * (Mantém chaves Omie como String, seguindo padrão usado em OmieProduct/ProductStock)
 */
export function mapOrder(pedido: unknown): OmieOrderMapped {
  const p: any = pedido ?? {};
  const cab = p?.cabecalho ?? {};
  const cad = p?.infoCadastro ?? {};

  const now = new Date();

  const order = {
    omieCode: String(cab.codigo_pedido),
    numeroPedido: cab.numero_pedido ? String(cab.numero_pedido) : null,
    codigoCliente: cab.codigo_cliente ? String(cab.codigo_cliente) : null,
    codigoEmpresa: cab.codigo_empresa ? String(cab.codigo_empresa) : null,

    etapa: String(cab.etapa ?? "").trim(),
    cancelado: String(cad.cancelado ?? "N").trim() || "N",
    encerrado: String(cab.encerrado ?? "N").trim() || "N",

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
    lastSyncAt: now,
  };

  const items = (p?.det ?? []).map((d: any) => {
    const prod = d?.produto ?? {};
    const ide = d?.ide ?? {};

    return {
      omieItemCode: String(ide.codigo_item),
      omieProductCode: prod.codigo_produto ? String(prod.codigo_produto) : null,
      sku: prod.codigo ?? null,

      description: String(prod.descricao ?? "").trim(),
      unit: prod.unidade ?? null,

      // Prisma Decimal aceita string
      quantity: String(prod.quantidade ?? 0),
      unitPrice: prod.valor_unitario != null ? String(prod.valor_unitario) : null,
      totalPrice: prod.valor_total != null ? String(prod.valor_total) : null,

      rawPayload: d,
      lastSyncAt: now,
    };
  });

  return { order, items };
}