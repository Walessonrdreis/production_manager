import {
  productIdParamsSchema,
  updateProductSectorBodySchema,
} from "./product-sector.schemas";

export function createProductSectorController(useCases: any) {
  return {
    async setDefault(request: any, reply: any) {
      const { productId } = productIdParamsSchema.parse(request.params);
      const { sectorId, notes } = updateProductSectorBodySchema.parse(request.body);

      const result = await useCases.setProductDefaultSector.execute({
        productId,
        sectorId,
        notes,
      });

      return reply.status(200).send(result);
    },

    async getDefault(request: any, reply: any) {
      const { productId } = productIdParamsSchema.parse(request.params);
      const data = await useCases.getProductDefaultSector.execute({ productId });
      return reply.send({ data });
    },
  };
}