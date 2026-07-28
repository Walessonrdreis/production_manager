/**
 * 🔪 Tokenization utilities for search
 *
 * Divide uma string normalizada em tokens para busca por relevância.
 * Remove tokens vazios ou muito curtos (menos de 2 caracteres).
 */

import { normalize } from './normalize';

/**
 * Tokeniza uma string de busca em palavras individuais.
 * Aplica normalize() internamente para consistência.
 *
 * @example
 * tokenize("42% cacau ao leite") // → ["42", "cacau", "ao", "leite"]
 * tokenize("")                   // → []
 * tokenize("a")                  // → []
 */
export function tokenize(q: string): string[] {
    if (!q || q.trim().length === 0) return [];

    const normalized = normalize(q);
    const raw = normalized.split(/\s+/);

    // Filtra tokens vazios ou muito curtos (menos de 2 chars)
    return raw.filter((t) => t.length >= 2);
}
