type Props = {
  loading: boolean
  page: number
  totalPages: number
  onFirst: () => void
  onPrev: () => void
  onNext: () => void
  onLast: () => void
}

export function PaginationControls({
  loading,
  page,
  totalPages,
  onFirst,
  onPrev,
  onNext,
  onLast,
}: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
      <button onClick={onFirst} disabled={loading || page === 1}>
        « Primeiro
      </button>
      <button onClick={onPrev} disabled={loading || page === 1}>
        ‹ Anterior
      </button>

      <span style={{ alignSelf: 'center', color: '#444' }}>
        Página <b>{page}</b> / <b>{totalPages}</b>
      </span>

      <button onClick={onNext} disabled={loading || page >= totalPages}>
        Próximo ›
      </button>
      <button onClick={onLast} disabled={loading || page >= totalPages}>
        Último »
      </button>
    </div>
  )
}