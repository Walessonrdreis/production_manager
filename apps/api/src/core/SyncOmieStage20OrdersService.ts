// apps/api/src/core/SyncOmieStage20OrdersService.ts

import { Prisma } from '@prisma/client'
import { prisma } from '../db'
import { omieClient } from '../integrations/omie/OmieClient'
import { OMIE_ENDPOINTS } from '../integrations/omie/omie.constants'
import { isEligibleStage20, mapOrder } from '../integrations/omie/OmieOrdersAdapter'
import { AppError } from './errors/AppError'

type OmieListOrdersResponse = {
  pagina: number
  total_de_paginas: number
  registros?: number
  total_de_registros?: number
  pedido_venda_produto?: any[]
}

export class SyncOmieStage20OrdersService {
  private readonly LOCK_KEY = 'omie:orders:stage20:sync'
  private readonly LOCK_TTL_MS = 5 * 60 * 1000
  private readonly PAGE_SIZE = 50

  // ✅ padrão interno (não depende de env de path/call)
  private readonly OMIE_PATH = OMIE_ENDPOINTS.PEDIDOS_VENDA_PRODUTOS.path
  private readonly OMIE_CALL = OMIE_ENDPOINTS.PEDIDOS_VENDA_PRODUTOS.call

  async run() {
    const lock = await this.acquireLock()
    if (!lock.acquired) {
      return {
        ok: true,
        reason: 'LOCKED',
        lockedUntil: lock.lockedUntil,
        syncedOrders: 0,
        skippedOrders: 0,
        pages: 0,
      }
    }

    let page = 1
    let totalPages = 1
    let syncedOrders = 0
    let skippedOrders = 0

    try {
      do {
        const resp = await this.listOrdersPage(page, this.PAGE_SIZE)

        totalPages = Number(resp?.total_de_paginas ?? 1)
        const pedidos: any[] = resp?.pedido_venda_produto ?? []

        // ✅ LOGS DE DEBUG (temporários)
        console.log('[OMIE] total pedidos recebidos:', pedidos.length)
        console.log(
          '[OMIE] etapas (amostra):',
          pedidos.slice(0, 5).map((p) => p?.cabecalho?.etapa)
        )

        for (const pedido of pedidos) {
          if (!isEligibleStage20(pedido)) {
            skippedOrders++
            continue
          }

          const { order, items } = mapOrder(pedido)

          const validItems = items.filter(
            (i: any) =>
              i?.omieItemCode &&
              i?.description &&
              String(i.description).trim().length > 0
          )

          await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const savedOrder = await tx.omieOrder.upsert({
              where: { omieCode: order.omieCode },
              create: order as any,
              update: order as any,
              select: { id: true },
            })

            for (const it of validItems) {
              await tx.omieOrderItem.upsert({
                where: { omieItemCode: it.omieItemCode },
                create: { ...it, omieOrderId: savedOrder.id } as any,
                update: { ...it, omieOrderId: savedOrder.id } as any,
              })
            }
          })

          syncedOrders++
        }

        await this.renewLock()
        page++
      } while (page <= totalPages)

      return {
        ok: true,
        reason: 'DONE',
        syncedOrders,
        skippedOrders,
        pages: totalPages,
      }
    } catch (err: any) {
      if (err instanceof AppError) throw err

      throw new AppError(
        'OMIE_STAGE20_ORDERS_SYNC_FAILED',
        500,
        'Falha ao sincronizar pedidos etapa 20',
        { message: err?.message }
      )
    } finally {
      await this.releaseLock()
    }
  }

  private async listOrdersPage(page: number, pageSize: number) {
    try {
      const payload = {
        call: this.OMIE_CALL,
        param: [{ pagina: page, registros_por_pagina: pageSize }],
      }

      return await omieClient.post<OmieListOrdersResponse>(this.OMIE_PATH, payload)
    } catch (err: any) {
      if (err instanceof AppError) throw err

      throw new AppError(
        'OMIE_LIST_ORDERS_FAILED',
        502,
        'Falha ao listar pedidos do Omie',
        { message: err?.message }
      )
    }
  }

  // ------------------------
  // LOCK via JobLock (tabela job_lock)
  // ------------------------

  private async acquireLock(): Promise<{ acquired: boolean; lockedUntil?: Date }> {
    const now = new Date()
    const lockedUntil = new Date(now.getTime() + this.LOCK_TTL_MS)

    try {
      await prisma.jobLock.create({
        data: { key: this.LOCK_KEY, lockedUntil },
      })
      return { acquired: true, lockedUntil }
    } catch {
      const existing = await prisma.jobLock.findUnique({
        where: { key: this.LOCK_KEY },
      })

      if (!existing) return { acquired: false }

      if (existing.lockedUntil <= now) {
        await prisma.jobLock.update({
          where: { key: this.LOCK_KEY },
          data: { lockedUntil },
        })
        return { acquired: true, lockedUntil }
      }

      return { acquired: false, lockedUntil: existing.lockedUntil }
    }
  }

  private async renewLock() {
    const lockedUntil = new Date(Date.now() + this.LOCK_TTL_MS)
    await prisma.jobLock.updateMany({
      where: { key: this.LOCK_KEY },
      data: { lockedUntil },
    })
  }

  private async releaseLock() {
    await prisma.jobLock.deleteMany({ where: { key: this.LOCK_KEY } })
  }
}
``