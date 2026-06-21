import type { PrismaClient } from "@prisma/client";
import type { ProductStructureFetchResult } from "../../application/ports/product-structure-fetch.gateway";

export class ProductStructureIntegrationStore {
  constructor(private readonly prisma: PrismaClient) { }

  async save(result: ProductStructureFetchResult): Promise<void> {
    const {
      productCode, hasStructure, items,
      description, familyCode, familyDescription,
      productType, unit, grossWeight, netWeight,
      omieProductId, omieProductIntegrationId,
    } = result;

    await this.prisma.productStructure.upsert({
      where: { codProduto: productCode },
      update: {
        descrProduto: description,
        codFamilia: familyCode,
        descrFamilia: familyDescription,
        tipoProduto: productType,
        unidProduto: unit,
        pesoBruto: grossWeight,
        pesoLiquido: netWeight,
        idProdutoOmie: omieProductId ? BigInt(omieProductId) : null,
        intProdutoOmie: omieProductIntegrationId,
        hasStructure,
        items: {
          deleteMany: {},
          create: items.map((item) => ({
            codProdutoComponente: item.componentCode,
            descrProdutoComponente: item.description,
            codFamiliaComponente: item.familyCode,
            descrFamiliaComponente: item.familyDescription,
            quantidade: item.quantity,
            unidade: item.unit,
            tipoProdutoComponente: item.productType,
            percentualPerda: item.loss,
            idMalhaOmie: item.omieMeshId ? BigInt(item.omieMeshId) : null,
          })),
        },
      },
      create: {
        codProduto: productCode,
        descrProduto: description,
        codFamilia: familyCode,
        descrFamilia: familyDescription,
        tipoProduto: productType,
        unidProduto: unit,
        pesoBruto: grossWeight,
        pesoLiquido: netWeight,
        idProdutoOmie: omieProductId ? BigInt(omieProductId) : null,
        intProdutoOmie: omieProductIntegrationId,
        hasStructure,
        items: {
          create: items.map((item) => ({
            codProdutoComponente: item.componentCode,
            descrProdutoComponente: item.description,
            codFamiliaComponente: item.familyCode,
            descrFamiliaComponente: item.familyDescription,
            quantidade: item.quantity,
            unidade: item.unit,
            tipoProdutoComponente: item.productType,
            percentualPerda: item.loss,
            idMalhaOmie: item.omieMeshId ? BigInt(item.omieMeshId) : null,
          })),
        },
      },
    });
  }

  async hasStructure(productCode: string): Promise<boolean> {
    const count = await this.prisma.productStructure.count({
      where: {
        codProduto: productCode,
        hasStructure: true,
      },
    });

    return count > 0;
  }
}