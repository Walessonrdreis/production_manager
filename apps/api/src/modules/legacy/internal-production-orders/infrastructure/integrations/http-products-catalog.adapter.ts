import type { ProductsCatalogPort, ProductCatalogInfo } from '../../application/ports/products-catalog.port'

interface LegacyProductResponse {
  products?: Array<{
    codigo_do_produto?: string
    codigo?: string
    descricao?: string
    estoque?: number
    estoque_minimo?: number
  }>
  data?: Array<{
    codigo_do_produto?: string
    codigo?: string
    descricao?: string
    estoque?: number
    estoque_minimo?: number
  }>
}

export class HttpProductsCatalogAdapter implements ProductsCatalogPort {
  private cache = new Map<string, { data: ProductCatalogInfo; timestamp: number }>()
  private cacheTtlMs = 5 * 60 * 1000

  constructor(
    private readonly baseUrl: string,
    private readonly logger?: { info: (msg: string, data?: unknown) => void; error: (msg: string, data?: unknown) => void },
  ) {}

  async findByOmieCode(omieCode: string): Promise<ProductCatalogInfo | null> {
    const cacheKey = `product:${omieCode}`
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      this.logger?.info('Catálogo: cache hit para omieCode', { omieCode })
      return cached.data
    }

    this.logger?.info('Catálogo: consultando produto', { omieCode })

    try {
      const response = await fetch(`${this.baseUrl}/v1/products`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        this.logger?.error('Catálogo: resposta não OK', { status: response.status, omieCode })
        return null
      }

      const body = (await response.json()) as LegacyProductResponse

      const products = body.products ?? body.data ?? []
      const found = products.find(
        (p) => p.codigo_do_produto === omieCode || p.codigo === omieCode,
      )

      if (!found) {
        this.logger?.info('Catálogo: produto não encontrado', { omieCode })
        return null
      }

      const result: ProductCatalogInfo = {
        productDescription: found.descricao ?? null,
        stockQuantity: found.estoque ?? null,
        minimumStock: found.estoque_minimo ?? null,
      }

      this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
      this.logger?.info('Catálogo: produto enriquecido', { omieCode })

      return result
    } catch (error) {
      this.logger?.error('Catálogo: erro na consulta', { omieCode, error: (error as Error).message })
      return null
    }
  }
}
