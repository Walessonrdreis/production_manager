
type Props = { error: string }

export function OrdersError({ error }: Props) {
  return (
    <div
      style={{
        padding: 12,
        background: '#ffecec',
        color: '#900',
        borderRadius: 6,
        marginTop: 12,
      }}
    >
      <b>Erro:</b> {error}
    </div>
  )
}