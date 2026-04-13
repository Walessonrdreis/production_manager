import { buildApp } from './app';
import { env } from './env';

async function bootstrap() {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

bootstrap();