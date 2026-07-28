type Props = {
  product: any;
  sectors: any[];

  onUpdateSector: (productId: string, sectorId: string) => void;
  onRemove: (productId: string) => void;

  isUpdating: boolean;
  isRemoving: boolean;
};

export function MyProductsRow({
  product,
  sectors,
  onUpdateSector,
  onRemove,
  isUpdating,
  isRemoving,
}: Props) {
  return (
    <tr>
        {/* Nome do produto */}
      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
        {product.omieProduct?.description}
      </td>
        {/* SKU  product Omie */}
      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
        {product.omieProduct?.omieId || '-'}
      </td>
        {/* Quantidade em Estoque  product Omie */}
      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
        {product.omieProduct?.stockQuantity || '-'}
      </td>
        {/* Setor do produto */}
      <td style={{ padding: '0.75rem', border: '1px solid #ddd' }}>
        
        <select
          value={product.productSector?.sectorId || ''}
          onChange={(e) => onUpdateSector(product.id, e.target.value)}
          disabled={isUpdating}
          style={{ padding: '0.4rem', borderRadius: '4px', width: '100%' }}
        >
          <option value="" disabled>
            Selecione um setor...
          </option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>
              {sector.name}
            </option>
          ))}
        </select>
      </td>

      <td
        style={{
          padding: '0.75rem',
          border: '1px solid #ddd',
          textAlign: 'center',
        }}
      >
        {/* Botão de Remover */}
        <button
          onClick={() => {
            if (
              window.confirm(
                'Tem certeza que deseja remover este produto da sua seleção?',
              )
            ) {
              onRemove(product.id);
            }
          }}
          disabled={isRemoving}
          style={{
            padding: '0.4rem 0.8rem',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isRemoving ? 'not-allowed' : 'pointer',
          }}
        >
          Remover
        </button>
      </td>
    </tr>
  );
}