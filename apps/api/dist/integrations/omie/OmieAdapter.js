"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OmieAdapter = void 0;
class OmieAdapter {
    static toProductDTO(raw) {
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
exports.OmieAdapter = OmieAdapter;
