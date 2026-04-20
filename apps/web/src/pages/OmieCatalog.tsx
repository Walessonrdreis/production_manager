import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useOmieProducts } from '../hooks/api/useOmieProducts';
import { toast } from 'react-hot-toast';

type ColumnKey =
  | 'code'
  | 'description'
  | 'family'
  | 'sku'
  | 'stock'
  | 'minimumStock'
  | 'status'
  | 'action';

const COLUMNS: Array<{ key: ColumnKey; label: string; width: number; align?: 'left' | 'center' | 'right' }> = [
  { key: 'code', label: 'Código', width: 140 },
  { key: 'description', label: 'Descrição', width: 360 },
  { key: 'family', label: 'Categoria', width: 220 },
  { key: 'sku', label: 'SKU', width: 140 },
  { key: 'stock', label: 'Estoque', width: 130 },
  { key: 'minimumStock', label: 'Mínimo', width: 130 },
  { key: 'status', label: 'Status', width: 90, align: 'center' },
  { key: 'action', label: 'Ação', width: 120, align: 'center' },
];

const COLUMN_STORAGE_KEY = 'omieCatalog.hiddenColumns.v1';

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function OmieCatalogPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);
  const isFamilyFiltered = Boolean(family);
  const pageSize = isFamilyFiltered ? 5000 : 20;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const { data, isLoading } = useOmieProducts(debouncedSearch, family, page, pageSize);
  const products = data?.items ?? [];
  const families = data?.families ?? [];
  const stockCacheUpdatedAt = data?.stockCacheUpdatedAt ?? null;
  const total = data?.meta?.total ?? 0;

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const overlayScrollRef = useRef<HTMLDivElement | null>(null);
  const overlayInnerRef = useRef<HTMLDivElement | null>(null);
  const isSyncingFromTable = useRef(false);
  const isSyncingFromOverlay = useRef(false);

  const [isHorizontalScrollable, setIsHorizontalScrollable] = useState(false);
  const [isOverlayHovered, setIsOverlayHovered] = useState(false);

  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(() => {
    try {
      const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return new Set();
      const next = new Set(parsed.filter((value): value is ColumnKey => typeof value === 'string'));
      next.delete('description');
      return next;
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, family]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch, family, page]);

  useEffect(() => {
    window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(Array.from(hiddenColumns)));
  }, [hiddenColumns]);

  const visibleIds = useMemo(() => products.map((item) => item.id), [products]);

  const isAllVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds.has(id));
  }, [selectedIds, visibleIds]);

  const selectedCount = selectedIds.size;

  const visibleColumns = useMemo(() => COLUMNS.filter((column) => !hiddenColumns.has(column.key)), [hiddenColumns]);
  const hiddenColumnList = useMemo(() => COLUMNS.filter((column) => hiddenColumns.has(column.key)), [hiddenColumns]);

  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const overlayEl = overlayScrollRef.current;
    const innerEl = overlayInnerRef.current;

    if (!tableEl || !overlayEl || !innerEl) {
      return;
    }

    const update = () => {
      const scrollWidth = tableEl.scrollWidth;
      const clientWidth = tableEl.clientWidth;
      setIsHorizontalScrollable(scrollWidth > clientWidth + 1);
      innerEl.style.width = `${scrollWidth}px`;
      overlayEl.scrollLeft = tableEl.scrollLeft;
    };

    update();

    const onTableScroll = () => {
      if (isSyncingFromOverlay.current) {
        isSyncingFromOverlay.current = false;
        return;
      }

      isSyncingFromTable.current = true;
      overlayEl.scrollLeft = tableEl.scrollLeft;
    };

    const onOverlayScroll = () => {
      if (isSyncingFromTable.current) {
        isSyncingFromTable.current = false;
        return;
      }

      isSyncingFromOverlay.current = true;
      tableEl.scrollLeft = overlayEl.scrollLeft;
    };

    tableEl.addEventListener('scroll', onTableScroll, { passive: true });
    overlayEl.addEventListener('scroll', onOverlayScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => update());
    resizeObserver.observe(tableEl);

    return () => {
      tableEl.removeEventListener('scroll', onTableScroll);
      overlayEl.removeEventListener('scroll', onOverlayScroll);
      resizeObserver.disconnect();
    };
  }, [visibleColumns, products.length, hiddenColumnList.length]);

  const hideColumn = (key: ColumnKey) => {
    if (key === 'description') return;
    setHiddenColumns((current) => new Set([...current, key]));
  };

  const showColumn = (key: ColumnKey) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const shouldSelectAll = !visibleIds.every((id) => next.has(id));

      if (shouldSelectAll) {
        for (const id of visibleIds) next.add(id);
      } else {
        for (const id of visibleIds) next.delete(id);
      }

      return next;
    });
  };

  const selectAllVisible = () => {
    setSelectedIds(new Set(visibleIds));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Seleção de Produto
  const selectMutation = useMutation({
    mutationFn: (omieProductId: string) => 
      apiClient.post('/v1/products', { omieProductId }),
    onSuccess: () => {
      toast.success('Produto selecionado com sucesso!');
      // Invalida a lista de 'Meus Produtos' para quando navegarmos para lá
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    }
  });

  const bulkSelectMutation = useMutation({
    mutationFn: (omieProductIds: string[]) =>
      apiClient.post<{ created: number; skippedExisting: number; requested: number }>('/v1/products/bulk', { omieProductIds }),
    onSuccess: (result) => {
      toast.success(`Adicionados: ${result.created} • Já existiam: ${result.skippedExisting}`);
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
      clearSelection();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao adicionar produtos.');
    },
  });

  const refreshStockMutation = useMutation({
    mutationFn: () => apiClient.post<{ stockCacheUpdatedAt: string | null }>('/v1/omie/products/stock/refresh'),
    onSuccess: () => {
      toast.success('Estoque Omie atualizado manualmente.');
      queryClient.invalidateQueries({ queryKey: ['omieProducts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Falha ao atualizar estoque da Omie.');
    },
  });

  const totalPages = !isFamilyFiltered ? Math.ceil(total / pageSize) : 0;

  const overlayScrollbar = isHorizontalScrollable ? (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '10px',
        width: 'min(1200px, calc(100% - 48px))',
        padding: '8px 10px',
        borderRadius: '12px',
        backgroundColor: 'rgba(15, 23, 42, 0.15)',
        backdropFilter: 'blur(6px)',
        border: '1px solid rgba(148, 163, 184, 0.45)',
        opacity: isOverlayHovered ? 1 : 0.35,
        transition: 'opacity 140ms ease',
        pointerEvents: 'auto',
        zIndex: 1000,
      }}
      onMouseEnter={() => setIsOverlayHovered(true)}
      onMouseLeave={() => setIsOverlayHovered(false)}
    >
      <div
        ref={overlayScrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          height: '14px',
          scrollbarWidth: 'thin',
        }}
      >
        <div ref={overlayInnerRef} style={{ height: '1px' }} />
      </div>
    </div>
  ) : null;

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Título  product Omie */}
        <h1>Catálogo Omie</h1>
        <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
          Voltar para Home
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            {/* Buscar  product Omie */}
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Buscar</label>
            <input
              type="text"
              placeholder="Buscar por descrição, código, SKU ou família..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: '0.5rem',
                width: '320px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            />
          </div>

          <div>
            {/* Família  product Omie */}
            <label style={{ display: 'block', marginBottom: '0.25rem' }}>Família</label>
            {/* Seleção de Família  product Omie */}
            <select
              value={family}
              onChange={(e) => setFamily(e.target.value)}
              style={{
                padding: '0.5rem',
                minWidth: '220px',
                fontSize: '1rem',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
            >
              {/* Todas as Famílias  product Omie */}
              <option value="">Todas as famílias</option>
              {/* Opções de Família  product Omie */}
              {families.map((familyOption) => (
                <option key={familyOption} value={familyOption}>
                  {familyOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
          <div style={{ color: '#475569', fontSize: '0.9rem' }}>
            Última atualização do estoque:{' '}
            <strong>
              {stockCacheUpdatedAt
                ? new Date(stockCacheUpdatedAt).toLocaleString('pt-BR')
                : 'Ainda não carregado'}
            </strong>
          </div>
          
          <button
            type="button"
            onClick={() => refreshStockMutation.mutate()}
            disabled={refreshStockMutation.isPending}
            style={{
              padding: '0.5rem 0.9rem',
              backgroundColor: refreshStockMutation.isPending ? '#94a3b8' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: refreshStockMutation.isPending ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {refreshStockMutation.isPending ? 'Atualizando...' : 'Atualizar estoque agora'}
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        {/* Última Atualização  product Omie */}
        <input
          type="text"
          readOnly
          value={`Atualização automática a cada 15 minutos${family ? ` • Família: ${family}` : ''}`}
          style={{
            padding: '0.5rem',
            width: '420px',
            fontSize: '0.95rem',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            color: '#475569'
          }}
        />
      </div>

      {isLoading && <p>Carregando catálogo...</p>}

      {!isLoading && data && (
        <>
          {overlayScrollbar && typeof document !== 'undefined' ? createPortal(overlayScrollbar, document.body) : null}
          {hiddenColumnList.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', color: '#475569' }}>
              <div style={{ fontWeight: 700 }}>Colunas ocultas:</div>
              {hiddenColumnList.map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => showColumn(column.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.6rem',
                    borderRadius: '999px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                  title="Mostrar coluna"
                >
                  <ChevronRightIcon />
                  {column.label}
                </button>
              ))}
            </div>
          ) : null}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            <div style={{ color: '#475569' }}>
              Selecionados: <strong>{selectedCount}</strong>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={visibleIds.length === 0}
                style={{
                  padding: '0.45rem 0.8rem',
                  backgroundColor: '#0f766e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: visibleIds.length === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Selecionar tudo
              </button>
              <button
                type="button"
                onClick={() => bulkSelectMutation.mutate(Array.from(selectedIds))}
                disabled={selectedCount === 0 || bulkSelectMutation.isPending}
                style={{
                  padding: '0.45rem 0.8rem',
                  backgroundColor: (selectedCount === 0 || bulkSelectMutation.isPending) ? '#94a3b8' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (selectedCount === 0 || bulkSelectMutation.isPending) ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {bulkSelectMutation.isPending ? 'Adicionando...' : 'Adicionar selecionados'}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                disabled={selectedCount === 0}
                style={{
                  padding: '0.45rem 0.8rem',
                  backgroundColor: 'white',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  cursor: selectedCount === 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                Limpar
              </button>
            </div>
          </div>

          <div
            ref={tableScrollRef}
            style={{
              overflowX: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          >
              <table style={{ width: 'max-content', borderCollapse: 'collapse', marginBottom: 0, tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', border: '1px solid #ddd', width: '52px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      aria-label="Selecionar todos visíveis"
                    />
                  </th>
                  {visibleColumns.map((column) => (
                    <th
                      key={column.key}
                      style={{
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        width: `${column.width}px`,
                        minWidth: `${column.width}px`,
                        maxWidth: `${column.width}px`,
                        textAlign: column.align ?? 'left',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'center' }}>
                        <span>{column.label}</span>
                        {column.key !== 'description' ? (
                          <button
                            type="button"
                            onClick={() => hideColumn(column.key)}
                            title="Ocultar coluna"
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 0,
                              color: '#334155',
                            }}
                          >
                            <ChevronLeftIcon />
                          </button>
                        ) : (
                          <div style={{ width: '28px', height: '28px' }} />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ padding: '0.75rem', border: '1px solid #ddd', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelected(product.id)}
                        aria-label={`Selecionar ${product.description}`}
                      />
                    </td>
                    {visibleColumns.map((column) => {
                      if (column.key === 'code') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              fontFamily: 'monospace',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.code || product.omieId}
                          </td>
                        );
                      }

                      if (column.key === 'description') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'normal',
                              overflow: 'visible',
                              textOverflow: 'clip',
                              wordBreak: 'break-word',
                            }}
                          >
                            {product.description}
                          </td>
                        );
                      }

                      if (column.key === 'family') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.familyDescription ?? '-'}
                          </td>
                        );
                      }

                      if (column.key === 'sku') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.sku || '-'}
                          </td>
                        );
                      }

                      if (column.key === 'stock') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.stockQuantity ?? 'Não informado'}
                          </td>
                        );
                      }

                      if (column.key === 'minimumStock') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {product.minimumStock ?? 'Não informado'}
                          </td>
                        );
                      }

                      if (column.key === 'status') {
                        return (
                          <td
                            key={column.key}
                            style={{
                              padding: '0.75rem',
                              border: '1px solid #ddd',
                              textAlign: 'center',
                              width: `${column.width}px`,
                              minWidth: `${column.width}px`,
                              maxWidth: `${column.width}px`,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <span
                              title={product.active ? 'Ativo' : 'Inativo'}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '999px',
                                backgroundColor: product.active ? '#e6ffe6' : '#ffe6e6',
                                color: product.active ? '#006600' : '#cc0000',
                                fontWeight: 800,
                              }}
                            >
                              {product.active ? '✓' : '×'}
                            </span>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={column.key}
                          style={{
                            padding: '0.75rem',
                            border: '1px solid #ddd',
                            textAlign: 'center',
                            width: `${column.width}px`,
                            minWidth: `${column.width}px`,
                            maxWidth: `${column.width}px`,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <button
                            onClick={() => selectMutation.mutate(product.id)}
                            disabled={selectMutation.isPending}
                            style={{
                              padding: '0.4rem 0.8rem',
                              backgroundColor: '#28a745',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: selectMutation.isPending ? 'not-allowed' : 'pointer',
                              opacity: selectMutation.isPending ? 0.7 : 1
                            }}
                          >
                            Adicionar
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={1 + visibleColumns.length} style={{ padding: '1rem', textAlign: 'center', border: '1px solid #ddd' }}>
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {!isFamilyFiltered && totalPages > 1 && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ padding: '0.5rem 1rem' }}
              >
                Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ padding: '0.5rem 1rem' }}
              >
                Próxima
              </button>
            </div>
          )}

          {isFamilyFiltered && (
            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
              Exibindo todos os produtos da família selecionada: <strong>{total}</strong> item(ns).
            </div>
          )}
        </>
      )}
    </div>
  );
}
