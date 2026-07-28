/**
 * 🧩 Stage Resolver
 *
 * Converte o código de etapa (stage) do Omie em valores de UX.
 * Usa STAGE_CONFIG como fonte da verdade.
 */

import { STAGE_CONFIG } from './stage-config';

export interface ResolvedStage {
    /** Nome amigável (ex: "Fabricação") */
    stageName: string;
    /** Ordem sequencial (1-6, ou 999 para desconhecido) */
    stageOrder: number;
    /** Grupo funcional (planning | execution | done | unknown) */
    stageGroup: string;
}

/**
 * Resolve um código de stage para valores de UX.
 *
 * @param stage - Código numérico da etapa (ex: "60", "40")
 * @returns Objeto com stageName, stageOrder e stageGroup
 *
 * @example
 * resolveStage("60")
 * // → { stageName: "Fabricação", stageOrder: 5, stageGroup: "execution" }
 *
 * resolveStage("99")
 * // → { stageName: "Etapa 99", stageOrder: 999, stageGroup: "unknown" }
 *
 * resolveStage("")
 * // → { stageName: "Desconhecida", stageOrder: 999, stageGroup: "unknown" }
 */
export function resolveStage(stage: string | null | undefined): ResolvedStage {
    if (!stage || stage.trim().length === 0) {
        return {
            stageName: 'Desconhecida',
            stageOrder: 999,
            stageGroup: 'unknown',
        };
    }

    const config = STAGE_CONFIG[stage.trim()];

    if (!config) {
        return {
            stageName: `Etapa ${stage.trim()}`,
            stageOrder: 999,
            stageGroup: 'unknown',
        };
    }

    return {
        stageName: config.name,
        stageOrder: config.order,
        stageGroup: config.group,
    };
}
