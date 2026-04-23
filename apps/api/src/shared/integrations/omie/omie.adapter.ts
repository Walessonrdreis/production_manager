// src/shared/integrations/omie/omie.adapter.ts
export type OmieProductDTO = {
  omieId: string;
  sku?: string | null;
  description: string;
  active: boolean;
  rawPayload: unknown;
};

// helpers internos (não exportados)
type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && !(typeof value === "string" && value.trim() === "");
}

function stringifyScalar(value: unknown): string | null {
  if (!hasValue(value)) return null;
  return String(value).trim();
}

function findNestedValue(raw: unknown, keys: string[]): string | null {
  if (!isPlainObject(raw)) return null;

  for (const key of keys) {
    const directValue = stringifyScalar(raw[key]);
    if (directValue !== null) return directValue;
  }

  for (const value of Object.values(raw)) {
    if (isPlainObject(value)) {
      const nestedValue = findNestedValue(value, keys);
      if (nestedValue !== null) return nestedValue;
    }
  }

  return null;
}

export class OmieAdapter {
  static extractProductCode(raw: unknown): string {
    const obj = raw as any;
    const value = obj?.codigo ?? obj?.codigo_produto ?? obj?.id ?? obj?.codigo_item;
    return value != null ? String(value) : "";
  }

  static extractStockProductCode(raw: unknown): string {
    return (
      findNestedValue(raw, [
        "cCodigo",
        "codigo",
        "codigo_produto",
        "id_prod",
        "idProd",
        "codigo_item",
        "cod_int",
        "cCodInt",
      ]) ?? ""
    );
  }

  static extractStockQuantity(raw: unknown): string | null {
    return findNestedValue(raw, [
      "nSaldo",
      "nSaldoEstoque",
      "quantidade_disponivel",
      "estoque_disponivel",
      "saldo_disponivel",
      "quantidade_estoque",
      "qtde_estoque",
      "saldo_estoque",
      "estoque_atual",
      "saldo",
      "estoque",
      "quantidade",
    ]);
  }

  static extractMinimumStock(raw: unknown): string | null {
    return findNestedValue(raw, [
      "nEstoqueMinimo",
      "estoque_minimo",
      "saldo_minimo",
      "quantidade_minima",
      "qtde_minima",
      "minimo",
      "estoqueMinimo",
    ]);
  }

  static extractFamilyDescription(raw: unknown): string | null {
    return findNestedValue(raw, [
      "descricao_familia",
      "descricaoFamilia",
      "familia",
      "nome_familia",
      "desc_familia",
      "cDescricaoFamilia",
    ]);
  }

  static toProductDTO(raw: unknown): OmieProductDTO {
    const obj = raw as any;

    return {
      omieId: this.extractProductCode(raw),
      sku: obj?.sku ?? null,
      description: obj?.descricao ?? obj?.descricao_produto ?? "Sem descrição",
      active: obj?.ativo !== undefined ? Boolean(obj.ativo) : true,
      rawPayload: raw,
    };
  }
}
