// ---------------------------------------------------------------------------
// Sync State Store — Interface + Implementação Prisma
// ---------------------------------------------------------------------------
// Centraliza o padrão de persistência de checkpoint de sincronização
// incremental, hoje duplicado entre sales-order-sync, customer-sync e
// product-stock-fetch.
//
// Uso:
//   const store = new PrismaSyncStateStore(prisma.meuSyncState, "GLOBAL");
//   const state = await store.getState();
//   await store.updateLastSync(new Date());
// ---------------------------------------------------------------------------

import type { SyncStateStoreContract } from "./types";

/**
 * Parâmetro do delegate Prisma aceito pelo PrismaSyncStateStore.
 *
 * Aceita qualquer delegate que tenha os métodos upsert/update com a assinatura
 * esperada. Isso permite passar diretamente `prisma.minhaTabelaSyncState`.
 */
export type PrismaSyncDelegate = {
    upsert(args: {
        where: { id: string };
        update: Record<string, unknown>;
        create: Record<string, unknown>;
    }): Promise<{ id: string; lastSyncAt: Date }>;

    update(args: {
        where: { id: string };
        data: { lastSyncAt: Date };
    }): Promise<{ id: string; lastSyncAt: Date }>;
};

/**
 * Implementação concreta de SyncStateStoreContract usando Prisma.
 *
 * Aceita qualquer delegate Prisma que exponha upsert/update, permitindo
 * reuso entre diferentes módulos sem duplicação de código.
 *
 * @example
 * ```ts
 * const store = new PrismaSyncStateStore(prisma.salesOrderSyncState, "GLOBAL");
 * const state = await store.getState(); // upsert → { id, lastSyncAt }
 * ```
 */
export class PrismaSyncStateStore implements SyncStateStoreContract {
    constructor(
        private readonly delegate: PrismaSyncDelegate,
        private readonly id: string = "GLOBAL"
    ) { }

    async getState() {
        return this.delegate.upsert({
            where: { id: this.id },
            update: {},
            create: {
                id: this.id,
                lastSyncAt: new Date("2000-01-01"),
            },
        });
    }

    async updateLastSync(date: Date) {
        await this.delegate.update({
            where: { id: this.id },
            data: { lastSyncAt: date },
        });
    }
}
