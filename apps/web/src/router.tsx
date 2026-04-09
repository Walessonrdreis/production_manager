import { createBrowserRouter } from 'react-router-dom';

// Componentes temporários para as rotas funcionarem antes de serem criados de fato
const SyncPage = () => <div>Sincronização com Omie</div>;
const OmieCatalogPage = () => <div>Catálogo Omie</div>;
const ProductsPage = () => <div>Meus Produtos</div>;
const SectorsPage = () => <div>Setores de Produção</div>;
const PlansPage = () => <div>Lista de Planos</div>;
const PlanDetailPage = () => <div>Detalhe do Plano</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <SyncPage />,
  },
  {
    path: '/omie',
    element: <OmieCatalogPage />,
  },
  {
    path: '/products',
    element: <ProductsPage />,
  },
  {
    path: '/sectors',
    element: <SectorsPage />,
  },
  {
    path: '/plans',
    element: <PlansPage />,
  },
  {
    path: '/plans/:id',
    element: <PlanDetailPage />,
  },
]);
