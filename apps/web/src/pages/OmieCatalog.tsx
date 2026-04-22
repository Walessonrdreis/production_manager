import { useOmieCatalog } from '../hooks/omie/useOmieCatalog';
import { OmieCatalogHeader } from '../components/omie/catalog/OmieCatalogHeader';
import { OmieCatalogFilters } from '../components/omie/catalog/OmieCatalogFilters';
import { OmieCatalogNote } from '../components/omie/catalog/OmieCatalogNote';
import { HiddenColumnsBar } from '../components/omie/catalog/HiddenColumnsBar';
import { OmieCatalogSelectionBar } from '../components/omie/catalog/OmieCatalogSelectionBar';
import { OmieCatalogTable } from '../components/omie/catalog/OmieCatalogTable';
import { OmieCatalogPagination } from '../components/omie/catalog/OmieCatalogPagination';
import { OmieCatalogFamilyNotice } from '../components/omie/catalog/OmieCatalogFamilyNotice';
import { OmieCatalogOverlayScrollbar } from '../components/omie/catalog/OmieCatalogOverlayScrollbar';

export function OmieCatalogPage() {
  const {
    data,
    isLoading,
    products,
    families,
    stockCacheUpdatedAt,
    total,

    search,
    setSearch,
    family,
    setFamily,

    page,
    totalPages,
    isFamilyFiltered,
    goPrev,
    goNext,
    setPage,

    selectedIds,
    selectedCount,
    visibleIds,
    isAllVisibleSelected,
    toggleSelected,
    toggleSelectAllVisible,
    selectAllVisible,
    clearSelection,

    visibleColumns,
    hiddenColumnList,
    hideColumn,
    showColumn,

    tableScrollRef,
    overlayScrollRef,
    overlayInnerRef,
    isHorizontalScrollable,
    isOverlayHovered,
    setIsOverlayHovered,

    selectMutation,
    bulkSelectMutation,
    refreshStockMutation,
  } = useOmieCatalog();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <OmieCatalogHeader />

      <OmieCatalogFilters
        search={search}
        onChangeSearch={setSearch}
        family={family}
        onChangeFamily={setFamily}
        families={families}
        stockCacheUpdatedAt={stockCacheUpdatedAt}
        refreshing={refreshStockMutation.isPending}
        onRefreshStock={() => refreshStockMutation.mutate()}
      />

      <OmieCatalogNote family={family} />

      {isLoading && <p>Carregando catálogo...</p>}

      {!isLoading && data && (
        <>
          <OmieCatalogOverlayScrollbar
            enabled={isHorizontalScrollable}
            hovered={isOverlayHovered}
            onHoverChange={setIsOverlayHovered}
            overlayScrollRef={overlayScrollRef}
            overlayInnerRef={overlayInnerRef}
          />

          <HiddenColumnsBar hiddenColumnList={hiddenColumnList} onShowColumn={showColumn} />

          <OmieCatalogSelectionBar
            selectedCount={selectedCount}
            visibleCount={visibleIds.length}
            bulkPending={bulkSelectMutation.isPending}
            onSelectAllVisible={selectAllVisible}
            onBulkAdd={() => bulkSelectMutation.mutate(Array.from(selectedIds))}
            onClearSelection={clearSelection}
          />

          <OmieCatalogTable
            products={products}
            visibleColumns={visibleColumns}
            tableScrollRef={tableScrollRef}
            selectedIds={selectedIds}
            isAllVisibleSelected={isAllVisibleSelected}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            onToggleSelected={toggleSelected}
            onHideColumn={hideColumn}
            selectingSingle={selectMutation.isPending}
            onAddSingle={(id) => selectMutation.mutate(id)}
          />

          <OmieCatalogPagination
            isFamilyFiltered={isFamilyFiltered}
            totalPages={totalPages}
            page={page}
            onPrev={goPrev}
            onNext={goNext}
            disablePrev={page === 1}
            disableNext={page === totalPages}
          />

          <OmieCatalogFamilyNotice isFamilyFiltered={isFamilyFiltered} total={total} />
        </>
      )}
    </div>
  );
}