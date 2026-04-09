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
});
