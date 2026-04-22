type Props = { isFamilyFiltered: boolean; total: number };

export function OmieCatalogFamilyNotice({ isFamilyFiltered, total }: Props) {
  if (!isFamilyFiltered) return null;

  return (
    <div style={{ color: '#475569', fontSize: '0.95rem' }}>
      Exibindo todos os produtos da família selecionada: <strong>{total}</strong> item(ns).
    </div>
  );
}