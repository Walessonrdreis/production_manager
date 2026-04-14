"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./env");
async function bootstrap() {
    try {
        const app = await (0, app_1.buildApp)();
        await app.listen({ port: env_1.env.PORT, host: '0.0.0.0' });
        app.log.info(`Server running on http://localhost:${env_1.env.PORT}`);
    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
}
bootstrap();
