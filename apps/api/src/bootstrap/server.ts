import { buildApp } from "./app";
import { env } from "../config";

export async function startServer() {
  const app = await buildApp();

  await app.listen({
    port: env.PORT,
    host: "0.0.0.0",
  });

  app.log.info(`Server running on http://localhost:${env.PORT}`);
}