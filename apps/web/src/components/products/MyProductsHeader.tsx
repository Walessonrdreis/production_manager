import { Link } from 'react-router-dom';

export function MyProductsHeader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h1>Meus Produtos</h1>
      <Link to="/" style={{ textDecoration: 'none', color: '#007bff' }}>
        Voltar para Home
      </Link>
    </div>
  );
}
