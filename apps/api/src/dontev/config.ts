import "dotenv/config";
import { buildApp } from "../bootstrap/app";
import { env } from "../config"; // ou "@/config" se seu runtime suportar alias no dev

async function bootstrap() {
  const app = await buildApp();
  await app.listen({ port: env.PORT, host: "0.0.0.0" });
  app.log.info(`Server running on http://localhost:${env.PORT}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});