"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appRoutes = appRoutes;
const omie_1 = require("./omie");
const sectors_1 = require("./sectors");
const products_1 = require("./products");
const product_sector_1 = require("./product-sector");
const plans_1 = require("./plans");
async function appRoutes(app) {
    // Rota Health no root
    app.get('/health', async () => {
        return { status: 'ok' };
    });
    // Registro das rotas da Omie
    app.register(omie_1.omieRoutes);
    // Registro das rotas de Setores
    app.register(sectors_1.sectorRoutes);
    // Registro das rotas de Produtos
    app.register(products_1.productsRoutes);
    // Registro das rotas de Mapeamento Produto-Setor
    app.register(product_sector_1.productSectorRoutes);
    // Registro das rotas de Planos de Produção
    app.register(plans_1.plansRoutes);
}
