export type OmieProductDTO = {
  omieId: string;
  sku?: string | null;
  description: string;
  active: boolean;
  rawPayload: any;
};

export class OmieAdapter {
  static toProductDTO(raw: any): OmieProductDTO {
    return {
      // Usamos String() para garantir que ids numéricos vindo da Omie sejam strings no banco
      omieId: String(raw.codigo ?? raw.id ?? raw.codigo_produto),
      
      // Fallback para nulo caso o sku não exista
      sku: raw.sku ?? null,
      
      // Fallbacks de descrição
      description: raw.descricao ?? raw.descricao_produto ?? 'Sem descrição',
      
      // Define como ativo se existir, caso contrário default para true
      active: raw.ativo !== undefined ? Boolean(raw.ativo) : true,
      
      // Mantém o payload original completo
      rawPayload: raw,
    };
  }
}
