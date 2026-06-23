// ---------------------------------------------------------------------------
// Port — Product Structure Lifecycle Gateway
// ---------------------------------------------------------------------------
// Gerencia o ciclo de vida de comandos de estrutura de produto:
// - confirm: marca comando como CONFIRMED (sucesso)
// - fail: marca comando como FAILED (erro)
// Usado pelas rotas de callback e pelo fluxo de comando assíncrono.
// ---------------------------------------------------------------------------

export type ProductStructureLifecycleGateway = {
    confirm(externalRequestId: string): Promise<any | null>;
    fail(
        externalRequestId: string,
        err: { code: string; message: string }
    ): Promise<any | null>;
};
