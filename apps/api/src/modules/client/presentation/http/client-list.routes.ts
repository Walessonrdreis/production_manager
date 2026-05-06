import { FastifyInstance } from "fastify";
import { ClientListController } from "./client-list.controller";

export async function clientListRoutes(app: FastifyInstance) {
  const controller = new ClientListController();

  app.get("/clients", controller.list.bind(controller));
}