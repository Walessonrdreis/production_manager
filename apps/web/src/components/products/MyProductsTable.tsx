import { MyProductsRow } from './MyProductsRow';

type Props = {
  products: any[];
  sectors: any[];

  onUpdateSector: (productId: string, sectorId: string) => void;
  onRemove: (productId: string) => void;

  isUpdating: boolean;
  isRemoving: boolean;
};

export function MyProductsTable({
  products,
  sectors,
  onUpdateSector,
  onRemove,
  isUpdating,
  isRemoving,
}: Props) {
  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        marginTop: '1rem',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: '760px',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
              Descrição Omie
            </th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
              SKU
            </th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
              Quantidade em Estoque
            </th>
            <th style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
              Setor Padrão
            </th>
            <th
              style={{
                padding: '0.75rem',
                border: '1px solid #ddd',
                width: '100px',
              }}
            >
              Ações
            </th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <MyProductsRow
              key={product.id ?? product.omieProductId}
              product={product}
              sectors={sectors}
              onUpdateSector={onUpdateSector}
              onRemove={onRemove}
              isUpdating={isUpdating}
              isRemoving={isRemoving}
            />
          ))}

          {products.length === 0 && (
            <tr>
              <td
                colSpan={5}
                style={{
                  padding: '1rem',
                  textAlign: 'center',
                  border: '1px solid #ddd',
                }}
              >
                Nenhum produto selecionado do Catálogo Omie.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}