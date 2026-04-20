type Props = {
  total: number
  page: number
  totalPages: number
  q: string
  visibleCount: number
}

export function OrdersSummary({ total, page, totalPages, q, visibleCount }: Props) {
  return (
    <p style={{ marginTop: 8, color: '#666' }}>
      Total no banco: <b>{total}</b> — Página <b>{page}</b> de <b>{totalPages}</b>
      {q.trim() ? (
        <>
          {' '}
          — Filtro local: <b>{visibleCount}</b> resultados nesta página
        </>
      ) : null}
    </p>
  )
}