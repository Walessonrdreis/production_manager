import { describe, it, expect } from 'vitest';
import { OmieAdapter } from '../src/integrations/omie/OmieAdapter';

describe('OmieAdapter.toProductDTO', () => {
  it('deve extrair campos corretamente de um payload padrao', () => {
    const raw = {
      codigo_produto: 12345,
      sku: 'SKU-001',
      descricao_produto: 'Produto Teste',
      ativo: true,
      extra: 'dado_extra',
    };

    const result = OmieAdapter.toProductDTO(raw);

    expect(result).toEqual({
      omieId: '12345',
      sku: 'SKU-001',
      description: 'Produto Teste',
      active: true,
      rawPayload: raw,
    });
  });

  it('deve lidar com diferentes formatos de ID (codigo vs id vs codigo_produto)', () => {
    expect(OmieAdapter.toProductDTO({ codigo: 111 }).omieId).toBe('111');
    expect(OmieAdapter.toProductDTO({ id: 222 }).omieId).toBe('222');
    expect(OmieAdapter.toProductDTO({ codigo_produto: 333 }).omieId).toBe('333');
  });

  it('deve usar nulo para sku caso nao exista', () => {
    const result = OmieAdapter.toProductDTO({ codigo: 1, descricao: 'Teste' });
    expect(result.sku).toBeNull();
  });

  it('deve usar fallbacks de descricao caso nao exista', () => {
    expect(OmieAdapter.toProductDTO({ codigo: 1, descricao: 'Desc 1' }).description).toBe('Desc 1');
    expect(OmieAdapter.toProductDTO({ codigo: 1, descricao_produto: 'Desc 2' }).description).toBe('Desc 2');
    expect(OmieAdapter.toProductDTO({ codigo: 1 }).description).toBe('Sem descrição');
  });

  it('deve assumir true caso ativo seja omitido', () => {
    expect(OmieAdapter.toProductDTO({ codigo: 1 }).active).toBe(true);
    expect(OmieAdapter.toProductDTO({ codigo: 1, ativo: false }).active).toBe(false);
  });

  it('deve extrair o codigo do produto com fallbacks', () => {
    expect(OmieAdapter.extractProductCode({ codigo: 10 })).toBe('10');
    expect(OmieAdapter.extractProductCode({ codigo_produto: 20 })).toBe('20');
    expect(OmieAdapter.extractProductCode({ id: 30 })).toBe('30');
  });

  it('deve extrair o codigo do produto a partir do payload do estoque', () => {
    expect(OmieAdapter.extractStockProductCode({ cCodigo: 'ABC-10' })).toBe('ABC-10');
    expect(OmieAdapter.extractStockProductCode({ id_prod: 20 })).toBe('20');
    expect(OmieAdapter.extractStockProductCode({ produto: { codigo_produto: 30 } })).toBe('30');
  });

  it('deve extrair quantidade de estoque de diferentes formatos', () => {
    expect(OmieAdapter.extractStockQuantity({ nSaldo: -15 })).toBe('-15');
    expect(OmieAdapter.extractStockQuantity({ saldo_estoque: 12 })).toBe('12');
    expect(OmieAdapter.extractStockQuantity({ quantidade_estoque: 0 })).toBe('0');
    expect(OmieAdapter.extractStockQuantity({ estoque_disponivel: -7 })).toBe('-7');
    expect(OmieAdapter.extractStockQuantity({ dados_estoque: { quantidade: 8 } })).toBe('8');
    expect(OmieAdapter.extractStockQuantity({ produto_estoque: { saldo: '19' } })).toBe('19');
    expect(OmieAdapter.extractStockQuantity({ dados_estoque: { saldo_disponivel: '-12.5' } })).toBe('-12.5');
    expect(OmieAdapter.extractStockQuantity({})).toBeNull();
  });

  it('deve extrair estoque minimo com fallbacks', () => {
    expect(OmieAdapter.extractMinimumStock({ nEstoqueMinimo: 4 })).toBe('4');
    expect(OmieAdapter.extractMinimumStock({ dados_estoque: { estoque_minimo: '10' } })).toBe('10');
    expect(OmieAdapter.extractMinimumStock({})).toBeNull();
  });

  it('deve extrair descricao da familia com fallbacks', () => {
    expect(OmieAdapter.extractFamilyDescription({ descricao_familia: 'Bebidas' })).toBe('Bebidas');
    expect(OmieAdapter.extractFamilyDescription({ produto: { nome_familia: 'Padaria' } })).toBe('Padaria');
    expect(OmieAdapter.extractFamilyDescription({})).toBeNull();
  });
});
