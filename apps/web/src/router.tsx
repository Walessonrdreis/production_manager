import { createBrowserRouter } from 'react-router-dom';
import { SyncPage } from './pages/Sync';
import { OmieCatalogPage } from './pages/OmieCatalog';
import { MyProductsPage } from './pages/MyProducts';
import { SectorsPage } from './pages/Sectors';
import { PlansPage } from './pages/Plans';
import { PlanDetailPage } from './pages/Plan';

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
    element: <MyProductsPage />,
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
