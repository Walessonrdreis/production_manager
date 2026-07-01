/**
 * 🔤 Search Normalization Utilities
 *
 * Versão versionada do normalizador de texto para busca.
 * Toda mudança no algoritmo deve incrementar NORMALIZE_VERSION
 * e disparar rebuild do read model.
 */

export const NORMALIZE_VERSION = 1;

/**
 * Normaliza uma string para busca:
 * - lower case
 * - remove acentos (NFD + diacritics)
 * - trim
 *
 * @example
 * normalize("Cacau 42%") // → "cacau 42"
 * normalize("CACÁU")     // → "cacau"
 * normalize("  João  ")  // → "joao"
 */
export function normalize(str: string): string {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[%\/]/g, ' ') // substitui % e / por espaço (consistência com tokenize)
        .replace(/\s+/g, ' ')   // colapsa espaços múltiplos
        .trim();
}
