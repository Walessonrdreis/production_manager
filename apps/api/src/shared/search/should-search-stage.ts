/**
 * 🚦 Stage Search Guard
 *
 * Determina se o campo stageName deve ser incluído na busca.
 * Evita que buscas muito curtas (ex: "c", "f") explodam resultados
 * com OPs da "Fabricação" ou "Concluída".
 *
 * Regra: stage entra na busca apenas se houver ao menos um token
 * com 3 ou mais caracteres.
 *
 * @example
 * shouldSearchStage(["c"])        // → false (1 char, explode resultados)
 * shouldSearchStage(["ca"])       // → false (2 chars, ainda muito curto)
 * shouldSearchStage(["cacau"])    // → true  (3+ chars, busca legítima)
 * shouldSearchStage(["fab"])      // → true  (prefixo de "Fabricação")
 * shouldSearchStage(["42", "av"]) // → false (2 chars cada)
 * shouldSearchStage(["42", "cacau"]) // → true (um token tem 3+ chars)
 */
export function shouldSearchStage(tokens: string[]): boolean {
    return tokens.some((t) => t.length >= 3);
}
