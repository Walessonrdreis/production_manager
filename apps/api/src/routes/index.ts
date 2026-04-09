import { FastifyInstance } from 'fastify';
import { omieRoutes } from './omie';
import { sectorRoutes } from './sectors';
import { productSectorRoutes } from './product-sector';
import { plansRoutes } from './plans';

export async function appRoutes(app: FastifyInstance) {
  // Rota Health no root
  app.get('/health', async () => {
    return { status: 'ok' };
  });

  // Registro das rotas da Omie
  app.register(omieRoutes);
  
  // Registro das rotas de Setores
  app.register(sectorRoutes);

  // Registro das rotas de Mapeamento Produto-Setor
  app.register(productSectorRoutes);

  // Registro das rotas de Planos de Produção
  app.register(plansRoutes);
}
