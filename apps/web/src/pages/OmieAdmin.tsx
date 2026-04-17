import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchOmieCategories,
  fetchOmieProductByCode,
  fetchOmieProductById,
  fetchOmieProductStockByCode,
  fetchOmieProductStockById,
  fetchOmieStockInfo,
  pingStage20Sync,
  refreshOmieStock,
  searchOmieProducts,
  syncOmieProducts,
  type OmieProductDetails,
  type OmieProductStock,
  type OmieSearchItem,
  type OmieStockInfo,
} from '../lib/omieAdminApi'

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function OmieAdminPage() {
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  const [stockInfo, setStockInfo] = useState<OmieStockInfo | null>(null)
  const [categoriesQuery, setCategoriesQuery] = useState('')
  const [categories, setCategories] = useState<string[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [searchPage, setSearchPage] = useState(1)
  const [searchRows, setSearchRows] = useState<OmieSearchItem[]>([])
  const [searchTotal, setSearchTotal] = useState(0)

  const [includeRaw, setIncludeRaw] = useState(false)
  const [lookupId, setLookupId] = useState('')
  const [lookupCode, setLookupCode] = useState('')
  const [productDetails, setProductDetails] = useState<OmieProductDetails | null>(null)
  const [productStock, setProductStock] = useState<OmieProductStock | null>(null)

  async function runAction<T>(key: string, fn: () => Promise<T>) {
    setBusyAction(key)
    setError(null)
    setResultMessage(null)
    try {
      return await fn()
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao executar acao')
      return null
    } finally {
      setBusyAction(null)
    }
  }

  async function handleSyncProducts() {
    const response = await runAction('sync-products', () => syncOmieProducts())
    if (!response) return
    const upserted = response.data?.upserted ?? response.data?.inserted ?? 0
    setResultMessage(`Sync de produtos concluido. Registros processados: ${upserted}.`)
  }

  async function handleRefreshStock() {
    const response = await runAction('refresh-stock', () => refreshOmieStock(false))
    if (!response) return
    setResultMessage(`Refresh de estoque concluido. Inseridos: ${response.data.insertedCount}.`)
  }

  async function handlePingStage20() {
    const response = await runAction('ping-stage20', () => pingStage20Sync())
    if (!response) return
    setResultMessage(`Ping da integracao Stage 20: ${response.data.ok ? 'ok' : 'falhou'}.`)
  }

  async function handleLoadStockInfo() {
    const response = await runAction('stock-info', () => fetchOmieStockInfo())
    if (!response) return
    setStockInfo(response.data)
  }

  async function handleLoadCategories() {
    const response = await runAction('categories', () => fetchOmieCategories(categoriesQuery))
    if (!response) return
    setCategories(response.data ?? [])
  }

  async function handleSearchProducts(page = searchPage) {
    if (!searchQuery.trim()) {
      setError('Informe um termo de busca para consultar produtos.')
      return
    }
    const response = await runAction('search-products', () =>
      searchOmieProducts({ q: searchQuery.trim(), page, pageSize: 20 })
    )
    if (!response) return
    setSearchRows(response.data ?? [])
    setSearchTotal(response.meta?.total ?? 0)
    setSearchPage(response.meta?.page ?? page)
  }

  async function handleLookupById() {
    if (!lookupId.trim()) {
      setError('Informe um ID de produto.')
      return
    }
    const [detailsResponse, stockResponse] = await Promise.all([
      runAction('lookup-id-details', () => fetchOmieProductById(lookupId.trim(), includeRaw)),
      runAction('lookup-id-stock', () => fetchOmieProductStockById(lookupId.trim())),
    ])
    if (detailsResponse) setProductDetails(detailsResponse.data)
    if (stockResponse) setProductStock(stockResponse.data)
  }

  async function handleLookupByCode() {
    if (!lookupCode.trim()) {
      setError('Informe um codigo Omie.')
      return
    }
    const [detailsResponse, stockResponse] = await Promise.all([
      runAction('lookup-code-details', () => fetchOmieProductByCode(lookupCode.trim(), includeRaw)),
      runAction('lookup-code-stock', () => fetchOmieProductStockByCode(lookupCode.trim())),
    ])
    if (detailsResponse) setProductDetails(detailsResponse.data)
    if (stockResponse) setProductStock(stockResponse.data)
  }

  const searchTotalPages = Math.max(1, Math.ceil(searchTotal / 20))

  return (
    <div style={{ padding: 16, fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>OMIE Admin</h1>
        <Link to="/">Home</Link>
      </div>

      <p style={{ color: '#555', marginTop: 8 }}>
        Tela para operar os endpoints de administracao definidos em <code>routes/omie.ts</code>.
      </p>

      {error && (
        <div style={{ marginTop: 10, background: '#ffecec', color: '#8a1c1c', padding: 10, borderRadius: 6 }}>
          {error}
        </div>
      )}
      {resultMessage && (
        <div style={{ marginTop: 10, background: '#edf7ed', color: '#1f5130', padding: 10, borderRadius: 6 }}>
          {resultMessage}
        </div>
      )}

      <section style={{ marginTop: 16 }}>
        <h2>Acoes</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleSyncProducts} disabled={busyAction !== null}>
            {busyAction === 'sync-products' ? 'Sincronizando...' : 'Sync Produtos OMIE'}
          </button>
          <button onClick={handleRefreshStock} disabled={busyAction !== null}>
            {busyAction === 'refresh-stock' ? 'Atualizando...' : 'Refresh Estoque'}
          </button>
          <button onClick={handlePingStage20} disabled={busyAction !== null}>
            {busyAction === 'ping-stage20' ? 'Consultando...' : 'Ping Stage 20'}
          </button>
          <button onClick={handleLoadStockInfo} disabled={busyAction !== null}>
            {busyAction === 'stock-info' ? 'Consultando...' : 'Info de Estoque'}
          </button>
        </div>

        {stockInfo && (
          <div style={{ marginTop: 10 }}>
            <b>Ultimo refresh:</b> {stockInfo.lastRefreshAt ?? '-'} | <b>Total itens:</b> {stockInfo.totalItems} |{' '}
            <b>Fonte:</b> {stockInfo.source}
          </div>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Categorias</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={categoriesQuery}
            onChange={(e) => setCategoriesQuery(e.target.value)}
            placeholder="Filtro de categoria (opcional)"
            style={{ padding: 6, minWidth: 280 }}
          />
          <button onClick={handleLoadCategories} disabled={busyAction !== null}>
            {busyAction === 'categories' ? 'Carregando...' : 'Buscar Categorias'}
          </button>
        </div>
        {categories.length > 0 && (
          <ul style={{ marginTop: 10 }}>
            {categories.map((category) => (
              <li key={category}>{category}</li>
            ))}
          </ul>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Busca de Produtos</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por descricao, sku ou familia"
            style={{ padding: 6, minWidth: 320 }}
          />
          <button
            onClick={() => {
              setSearchPage(1)
              void handleSearchProducts(1)
            }}
            disabled={busyAction !== null}
          >
            {busyAction === 'search-products' ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {searchRows.length > 0 && (
          <>
            <p style={{ marginTop: 8, color: '#555' }}>
              Total: {searchTotal} | Pagina {searchPage} de {searchTotalPages}
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Descricao</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>SKU</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Familia</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Ativo</th>
                    <th style={{ textAlign: 'left', padding: 8, borderBottom: '1px solid #ddd' }}>Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {searchRows.map((row) => (
                    <tr key={row.id}>
                      <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{row.description}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{row.sku ?? '-'}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{row.familyDescription ?? '-'}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>{row.active ? 'Sim' : 'Nao'}</td>
                      <td style={{ padding: 8, borderBottom: '1px solid #f2f2f2' }}>
                        <button
                          onClick={() => {
                            setLookupId(row.id)
                            if (row.omieCode) setLookupCode(row.omieCode)
                          }}
                        >
                          Preencher consulta
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                onClick={() => {
                  const next = Math.max(1, searchPage - 1)
                  setSearchPage(next)
                  void handleSearchProducts(next)
                }}
                disabled={busyAction !== null || searchPage <= 1}
              >
                Anterior
              </button>
              <button
                onClick={() => {
                  const next = Math.min(searchTotalPages, searchPage + 1)
                  setSearchPage(next)
                  void handleSearchProducts(next)
                }}
                disabled={busyAction !== null || searchPage >= searchTotalPages}
              >
                Proxima
              </button>
            </div>
          </>
        )}
      </section>

      <section style={{ marginTop: 20 }}>
        <h2>Consulta de Produto</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <input
            type="checkbox"
            checked={includeRaw}
            onChange={(e) => setIncludeRaw(e.target.checked)}
          />
          includeRaw no endpoint de detalhes
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder="ID (UUID)"
            style={{ padding: 6, minWidth: 260 }}
          />
          <button onClick={handleLookupById} disabled={busyAction !== null}>
            Consultar por ID
          </button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
          <input
            value={lookupCode}
            onChange={(e) => setLookupCode(e.target.value)}
            placeholder="Codigo OMIE"
            style={{ padding: 6, minWidth: 260 }}
          />
          <button onClick={handleLookupByCode} disabled={busyAction !== null}>
            Consultar por Codigo
          </button>
        </div>

        {productDetails && (
          <div style={{ marginTop: 12 }}>
            <h3>Detalhes</h3>
            <pre style={{ background: '#f8fafc', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
              {safeJson(productDetails)}
            </pre>
          </div>
        )}

        {productStock && (
          <div style={{ marginTop: 12 }}>
            <h3>Estoque</h3>
            <pre style={{ background: '#f8fafc', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
              {safeJson(productStock)}
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}
