import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { useDebounce } from '../../hooks/useDebounce';
import { useOmieProducts } from '../../hooks/api/useOmieProducts';
import { toast } from 'react-hot-toast';
import { COLUMNS, type ColumnKey } from '../../domain/omie/catalogColumns';
import { loadHiddenColumns, persistHiddenColumns } from '../../domain/omie/catalogStorage';

type BulkResult = { created: number; skippedExisting: number; requested: number };

// Tipagem leve só para melhorar leitura (sem mudar API)
export type OmieCatalogProduct = {
  id: string;
  description: string;
  code?: string;
  omieId?: string;
  familyDescription?: string | null;
  sku?: string | null;
  stockQuantity?: number | string | null;
  minimumStock?: number | string | null;
  active?: boolean;
};

export function useOmieCatalog() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [page, setPage] = useState(1);
  const isFamilyFiltered = Boolean(family);
  const pageSize = isFamilyFiltered ? 5000 : 20;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const { data, isLoading } = useOmieProducts(debouncedSearch, family, page, pageSize);
  const products = (data?.items ?? []) as OmieCatalogProduct[];
  const families = (data?.families ?? []) as string[];
  const stockCacheUpdatedAt = (data?.stockCacheUpdatedAt ?? null) as string | null;
  const total = (data?.meta?.total ?? 0) as number;

  // overlay scroll sync
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const overlayScrollRef = useRef<HTMLDivElement>(null);
  const overlayInnerRef = useRef<HTMLDivElement>(null);
  const isSyncingFromTable = useRef(false);
  const isSyncingFromOverlay = useRef(false);

  const [isHorizontalScrollable, setIsHorizontalScrollable] = useState(false);
  const [isOverlayHovered, setIsOverlayHovered] = useState(false);

  // hidden columns + localStorage
  const [hiddenColumns, setHiddenColumns] = useState<Set<ColumnKey>>(() => loadHiddenColumns());

  // comportamento original: reset page ao mudar filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, family]);

  // comportamento original: limpa seleção ao mudar filtros/página
  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch, family, page]);

  // persistência
  useEffect(() => {
    persistHiddenColumns(hiddenColumns);
  }, [hiddenColumns]);

  const visibleIds = useMemo(() => products.map((item) => item.id), [products]);

  const isAllVisibleSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds.has(id));
  }, [selectedIds, visibleIds]);

  const selectedCount = selectedIds.size;

  const visibleColumns = useMemo(() => COLUMNS.filter((col) => !hiddenColumns.has(col.key)), [hiddenColumns]);
  const hiddenColumnList = useMemo(() => COLUMNS.filter((col) => hiddenColumns.has(col.key)), [hiddenColumns]);

  // scroll-sync overlay (mesma lógica da Page original)
  useEffect(() => {
    const tableEl = tableScrollRef.current;
    const overlayEl = overlayScrollRef.current;
    const innerEl = overlayInnerRef.current;

    if (!tableEl || !overlayEl || !innerEl) return;

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

  const hideColumn = useCallback((key: ColumnKey) => {
    if (key === 'description') return; // comportamento original
    setHiddenColumns((current) => new Set([...current, key]));
  }, []);

  const showColumn = useCallback((key: ColumnKey) => {
    setHiddenColumns((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  }, []);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAllVisible = useCallback(() => {
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
  }, [visibleIds]);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(visibleIds));
  }, [visibleIds]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // mutations: mesmas rotas + toasts + invalidação
  const selectMutation = useMutation({
    mutationFn: (omieProductId: string) => apiClient.post('/v1/products', { omieProductId }),
    onSuccess: () => {
      toast.success('Produto selecionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['myProducts'] });
    },
  });

  const bulkSelectMutation = useMutation({
    mutationFn: (omieProductIds: string[]) =>
      apiClient.post<BulkResult>('/v1/products/bulk', { omieProductIds }),
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

  const goPrev = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goNext = useCallback(() => {
    setPage((p) => Math.min(totalPages, p + 1));
  }, [totalPages]);

  return {
    // query state
    data,
    isLoading,

    // data
    products,
    families,
    stockCacheUpdatedAt,
    total,

    // filters + paging
    search,
    setSearch,
    family,
    setFamily,
    page,
    setPage,
    pageSize,
    isFamilyFiltered,
    totalPages,
    goPrev,
    goNext,

    // selection
    selectedIds,
    selectedCount,
    visibleIds,
    isAllVisibleSelected,
    toggleSelected,
    toggleSelectAllVisible,
    selectAllVisible,
    clearSelection,

    // columns
    visibleColumns,
    hiddenColumnList,
    hideColumn,
    showColumn,

    // overlay
    tableScrollRef,
    overlayScrollRef,
    overlayInnerRef,
    isHorizontalScrollable,
    isOverlayHovered,
    setIsOverlayHovered,

    // mutations
    selectMutation,
    bulkSelectMutation,
    refreshStockMutation,
  };
}