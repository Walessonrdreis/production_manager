import { createBrowserRouter } from 'react-router-dom';
import { SyncPage } from './pages/Sync';
import { OmieCatalogPage } from './pages/OmieCatalog';
import { MyProductsPage } from './pages/MyProducts';
import { SectorsPage } from './pages/Sectors';
import { PlansPage } from './pages/Plans';
import { PlanDetailPage } from './pages/Plan';

import { OrdersPage } from './pages/Orders';
import { Stage20TotalsPage } from './pages/Stage20Totals';
import { Stage20OrdersPage } from './pages/Stage20Orders';
import { OmieAdminPage } from './pages/OmieAdmin';
import { InternalProductionOrdersPage } from './pages/InternalProductionOrders';

export const router = createBrowserRouter([
  { path: '/', element: <SyncPage /> },
  { path: '/omie', element: <OmieCatalogPage /> },
  { path: '/products', element: <MyProductsPage /> },
  { path: '/sectors', element: <SectorsPage /> },
  { path: '/plans', element: <PlansPage /> },
  { path: '/plans/:id', element: <PlanDetailPage /> },

  { path: '/orders', element: <OrdersPage /> },
  { path: '/orders/stage20', element: <Stage20OrdersPage /> },
  { path: '/orders/stage20/totals', element: <Stage20TotalsPage /> },
  { path: '/omie/admin', element: <OmieAdminPage /> },
  { path: '/internal-production-orders', element: <InternalProductionOrdersPage /> },
]);
