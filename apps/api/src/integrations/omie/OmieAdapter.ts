export type OmieProductDTO = {
  omieId: string;
  sku?: string | null;
  description: string;
  active: boolean;
  rawPayload: any;
};

export class OmieAdapter {
  private static hasValue(value: unknown): boolean {
    return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
  }

  private static stringifyScalar(value: unknown): string | null {
    if (!this.hasValue(value)) {
      return null;
    }

    return String(value).trim();
  }

  private static findNestedValue(raw: any, keys: string[]): string | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    for (const key of keys) {
      const directValue = this.stringifyScalar(raw[key]);
      if (directValue !== null) {
        return directValue;
      }
    }

    for (const value of Object.values(raw)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nestedValue = this.findNestedValue(value, keys);
        if (nestedValue !== null) {
          return nestedValue;
        }
      }
    }

    return null;
  }

  static extractProductCode(raw: any): string {
    const value = raw?.codigo ?? raw?.codigo_produto ?? raw?.id ?? raw?.codigo_item;
    return value !== undefined && value !== null ? String(value) : '';
  }

  static extractStockProductCode(raw: any): string {
    return this.findNestedValue(raw, [
      'cCodigo',
      'codigo',
      'codigo_produto',
      'id_prod',
      'idProd',
      'codigo_item',
      'cod_int',
      'cCodInt',
    ]) ?? '';
  }

  static extractStockQuantity(raw: any): string | null {
    return this.findNestedValue(raw, [
      'nSaldo',
      'nSaldoEstoque',
      'quantidade_disponivel',
      'estoque_disponivel',
      'saldo_disponivel',
      'quantidade_estoque',
      'qtde_estoque',
      'saldo_estoque',
      'estoque_atual',
      'saldo',
      'estoque',
      'quantidade',
    ]);
  }

  static extractMinimumStock(raw: any): string | null {
    return this.findNestedValue(raw, [
      'nEstoqueMinimo',
      'estoque_minimo',
      'saldo_minimo',
      'quantidade_minima',
      'qtde_minima',
      'minimo',
      'estoqueMinimo',
    ]);
  }

  static extractFamilyDescription(raw: any): string | null {
    return this.findNestedValue(raw, [
      'descricao_familia',
      'descricaoFamilia',
      'familia',
      'nome_familia',
      'desc_familia',
      'cDescricaoFamilia',
    ]);
  }

  static toProductDTO(raw: any): OmieProductDTO {
    return {
      omieId: this.extractProductCode(raw),
      sku: raw.sku ?? null,
      description: raw.descricao ?? raw.descricao_produto ?? 'Sem descrição',
      active: raw.ativo !== undefined ? Boolean(raw.ativo) : true,
      rawPayload: raw,
    };
  }
}
