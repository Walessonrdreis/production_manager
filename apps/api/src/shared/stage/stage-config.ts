/**
 * 🏭 Stage Configuration
 *
 * Mapeamento dos códigos de etapa (stage) do Omie para valores de UX.
 * Esses valores são buscáveis, agrupáveis e ordenáveis.
 *
 * Códigos encontrados no banco:
 * 10, 20, 30, 40, 60, 80
 */

export interface StageInfo {
    /** Nome amigável para exibição (ex: "Fabricação") */
    name: string;
    /** Ordem sequencial para sorting (1-6) */
    order: number;
    /** Grupo funcional para agregação */
    group: 'planning' | 'execution' | 'done';
}

export const STAGE_CONFIG: Record<string, StageInfo> = {
    '10': { name: 'Planejada', order: 1, group: 'planning' },
    '20': { name: 'Liberada', order: 2, group: 'planning' },
    '30': { name: 'Separação Inicial', order: 3, group: 'execution' },
    '40': { name: 'Separação', order: 4, group: 'execution' },
    '60': { name: 'Fabricação', order: 5, group: 'execution' },
    '80': { name: 'Concluída', order: 6, group: 'done' },
};

/**
 * Lista de todos os códigos de stage válidos.
 */
export const STAGE_KEYS = Object.keys(STAGE_CONFIG);

/**
 * Lista de todos os grupos de stage.
 */
export const STAGE_GROUPS = Object.values(STAGE_CONFIG).map((s) => s.group);
