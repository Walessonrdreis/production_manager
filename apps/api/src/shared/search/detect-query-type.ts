/**
 * 🧠 Query Type Detection
 *
 * Identifica a intenção do usuário a partir do texto digitado.
 * O tipo detectado influencia os pesos do ranking.
 */

export type QueryType = 'orderNumber' | 'omieId' | 'code' | 'text';

/**
 * Detecta o tipo da query baseado em heurísticas simples:
 *
 * - Contém "/" → orderNumber (ex: "2025/01535")
 * - 6+ dígitos numéricos → omieId (ex: "9453409713")
 * - Apenas alfanumérico → code (ex: "42avkg")
 * - Caso contrário → text (ex: "cacau", "chocolate 42")
 */
export function detectQueryType(q: string): QueryType {
    if (!q || q.trim().length === 0) return 'text';

    const trimmed = q.trim();

    if (trimmed.includes('/')) return 'orderNumber';
    if (/^\d{6,}$/.test(trimmed)) return 'omieId';
    if (/^[a-z0-9]+$/i.test(trimmed)) return 'code';

    return 'text';
}
