// ---------------------------------------------------------------------------
// DTOs — Retry Failed Commands
// ---------------------------------------------------------------------------
// C1-P0: Re-enfileira comandos FAILED para nova tentativa.
// ---------------------------------------------------------------------------

export type RetryFailedRequestDTO = {
    /** Se informado, tenta apenas este comando específico */
    externalRequestId?: string;
    /** Limite de comandos a retentar (default: 50, max: 200) */
    limit?: number;
};

export type RetryFailedResponseDTO = {
    retried: number;
    totalFailedBefore: number;
    externalRequestIds: string[];
};
