type Props = {
  isFamilyFiltered: boolean;
  totalPages: number;
  page: number;
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
};

export function OmieCatalogPagination({
  isFamilyFiltered,
  totalPages,
  page,
  onPrev,
  onNext,
  disablePrev,
  disableNext,
}: Props) {
  if (isFamilyFiltered) return null;
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
      <button onClick={onPrev} disabled={disablePrev} style={{ padding: '0.5rem 1rem' }}>
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button onClick={onNext} disabled={disableNext} style={{ padding: '0.5rem 1rem' }}>
        Próxima
      </button>
    </div>
  );
}