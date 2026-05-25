export function resolveProductIdentifier(input: {
  codProduto?: string;
  idProduto?: number;
  intProduto?: string;
}) {
  const codProduto = input.codProduto?.trim();
  const intProduto = input.intProduto?.trim();
  const idProduto = input.idProduto;

  if (!codProduto && (idProduto === undefined || idProduto === null) && !intProduto) {
    const err = new Error("Informe ao menos um identificador: codProduto, idProduto ou intProduto.");
    (err as any).code = "VALIDATION_ERROR";
    throw err;
  }

  // Prioridade interna: codProduto > idProduto > intProduto
  if (codProduto) return { kind: "codProduto" as const, codProduto };
  if (typeof idProduto === "number" && !Number.isNaN(idProduto)) return { kind: "idProduto" as const, idProduto };
  return { kind: "intProduto" as const, intProduto: intProduto! };
}