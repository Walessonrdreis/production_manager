import crypto from "crypto";

export function computeStructureHash(payload: {
  codProduto: string;
  items: Array<{
    codProdutoComponente: string;
    quantidade: number;
    unidade?: string;
    percentualPerda?: number;
    idMalhaOmie?: number | null;
  }>;
}) {
  const normalizedItems = [...payload.items]
    .map((i) => ({
      codProdutoComponente: (i.codProdutoComponente ?? "").trim(),
      quantidade: Number(i.quantidade),
      unidade: i.unidade?.trim() ?? null,
      percentualPerda: i.percentualPerda ?? null,
      idMalhaOmie: i.idMalhaOmie ?? null,
    }))
    .sort((a, b) => {
      const ka = `${a.codProdutoComponente}:${a.idMalhaOmie ?? ""}`;
      const kb = `${b.codProdutoComponente}:${b.idMalhaOmie ?? ""}`;
      return ka.localeCompare(kb);
    });

  const raw = JSON.stringify({
    codProduto: payload.codProduto.trim(),
    items: normalizedItems,
  });

  return crypto.createHash("sha256").update(raw).digest("hex");
}