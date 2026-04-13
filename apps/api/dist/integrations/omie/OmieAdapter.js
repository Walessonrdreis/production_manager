"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmieAdapter = void 0;
class OmieAdapter {
    static hasValue(value) {
        return value !== undefined && value !== null && !(typeof value === 'string' && value.trim() === '');
    }
    static stringifyScalar(value) {
        if (!this.hasValue(value)) {
            return null;
        }
        return String(value).trim();
    }
    static findNestedValue(raw, keys) {
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
    static extractProductCode(raw) {
        const value = raw?.codigo ?? raw?.codigo_produto ?? raw?.id ?? raw?.codigo_item;
        return value !== undefined && value !== null ? String(value) : '';
    }
    static extractStockProductCode(raw) {
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
    static extractStockQuantity(raw) {
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
    static extractMinimumStock(raw) {
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
    static extractFamilyDescription(raw) {
        return this.findNestedValue(raw, [
            'descricao_familia',
            'descricaoFamilia',
            'familia',
            'nome_familia',
            'desc_familia',
            'cDescricaoFamilia',
        ]);
    }
    static toProductDTO(raw) {
        return {
            omieId: this.extractProductCode(raw),
            sku: raw.sku ?? null,
            description: raw.descricao ?? raw.descricao_produto ?? 'Sem descrição',
            active: raw.ativo !== undefined ? Boolean(raw.ativo) : true,
            rawPayload: raw,
        };
    }
}
exports.OmieAdapter = OmieAdapter;
