/**
 * ⭐ Search Scoring Engine
 *
 * Calcula a relevância de um registro contra os tokens da query.
 * Suporta match ALL (todos os tokens) vs PARTIAL (algum token)
 * com pesos diferentes por campo e tipo de query.
 */

import { QueryType } from './detect-query-type';

/**
 * Campos do read model usados para pontuação.
 */
export interface ScorableFields {
    productName: string;
    productCode: string;
    orderNumber: string;
    stageName?: string;
}

/**
 * Pesos por campo e tipo de query.
 * ALL = todos os tokens batem no campo.
 * PARTIAL = apenas algum token bate.
 */
const WEIGHTS: Record<keyof ScorableFields, { all: number; partial: number }> = {
    productName: { all: 100, partial: 60 },
    productCode: { all: 95, partial: 55 },
    orderNumber: { all: 100, partial: 70 },
    stageName: { all: 80, partial: 40 },
};

/**
 * Verifica se um token individual está presente em um campo.
 * Usa `includes` para substring match (prefixo ou contains).
 */
function tokenMatchesField(token: string, field: string): boolean {
    return field.toLowerCase().includes(token);
}

/**
 * Calcula o score para UM campo específico.
 *
 * @returns Pontuação 0-100, ou 0 se o campo não for relevante para o tipo de query.
 */
function scoreField(
    tokens: string[],
    fieldValue: string,
    fieldName: keyof ScorableFields,
): number {
    if (!fieldValue || fieldValue.trim().length === 0) return 0;

    const field = fieldValue.toLowerCase();
    const weights = WEIGHTS[fieldName];

    // ALL: todos os tokens batem no campo
    if (tokens.every((t) => tokenMatchesField(t, field))) {
        return weights.all;
    }

    // PARTIAL: algum token bate no campo
    if (tokens.some((t) => tokenMatchesField(t, field))) {
        return weights.partial;
    }

    return 0;
}

/**
 * Resultado do scoring para um registro.
 */
export interface ScoredResult {
    score: number;
    matchedFields: string[];
}

/**
 * Calcula o score de um registro contra os tokens da query.
 *
 * O score final é a SOMA dos scores individuais de cada campo,
 * permitindo que registros que batem em múltiplos campos fiquem
 * no topo.
 *
 * @example
 * const result = score(["cacau", "42"], {
 *   productName: "42% cacau ao leite",
 *   productCode: "42avkg",
 *   orderNumber: "2025/01535",
 * });
 * // result.score = 100 (ALL productName) + 95 (ALL productCode) = 195
 */
export function score(
    tokens: string[],
    fields: ScorableFields,
    _queryType?: QueryType,
): ScoredResult {
    if (tokens.length === 0) {
        return { score: 0, matchedFields: [] };
    }

    const matchedFields: string[] = [];
    let totalScore = 0;

    const fieldEntries: Array<[keyof ScorableFields, string | undefined]> = [
        ['productName', fields.productName],
        ['productCode', fields.productCode],
        ['orderNumber', fields.orderNumber],
    ];

    // stageName é opcional — só pontua se existir
    if (fields.stageName !== undefined && fields.stageName.trim().length > 0) {
        fieldEntries.push(['stageName', fields.stageName]);
    }

    for (const [fieldName, fieldValue] of fieldEntries) {
        if (!fieldValue) continue;

        const fieldScore = scoreField(tokens, fieldValue, fieldName);
        if (fieldScore > 0) {
            totalScore += fieldScore;
            matchedFields.push(fieldName);
        }
    }

    return {
        score: totalScore,
        matchedFields,
    };
}
