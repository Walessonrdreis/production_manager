// ---------------------------------------------------------------------------
// Query Utils — product-stock-fetch
// Helpers de sanitização e validação de parâmetros de consulta.
// ---------------------------------------------------------------------------

/**
 * Sanitiza um valor numérico a partir de string ou número.
 * Retorna o valor padrão se o valor for inválido.
 */
export function sanitizeNumericParam(
    raw: string | number | undefined | null,
    defaultVal: number,
    min = 1,
    max = 10000,
): number {
    const val = typeof raw === "string" ? parseInt(raw, 10) : (raw ?? defaultVal);
    if (Number.isNaN(val) || val < min) return defaultVal;
    if (val > max) return max;
    return val;
}

/**
 * Sanitiza um parâmetro booleano a partir de string ou booleano.
 */
export function sanitizeBooleanParam(
    raw: string | boolean | undefined | null,
    defaultVal = false,
): boolean {
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") return raw === "true" || raw === "1";
    return defaultVal;
}

/**
 * Sanitiza um parâmetro de string com limite de comprimento.
 */
export function sanitizeStringParam(
    raw: string | undefined | null,
    maxLength = 255,
    defaultVal = "",
): string {
    if (!raw) return defaultVal;
    return raw.trim().substring(0, maxLength);
}
