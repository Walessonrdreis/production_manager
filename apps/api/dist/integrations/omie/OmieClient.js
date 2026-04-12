"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.omieClient = exports.OmieClient = void 0;
const env_1 = require("../../env");
const AppError_1 = require("../../core/errors/AppError");
class OmieClient {
    TIMEOUT_MS = 20000;
    async post(path, payload) {
        const url = new URL(path, env_1.env.OMIE_BASE_URL).toString();
        const body = {
            ...payload,
            app_key: env_1.env.OMIE_APP_KEY,
            app_secret: env_1.env.OMIE_APP_SECRET,
        };
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            const text = await response.text();
            if (!response.ok) {
                throw new AppError_1.AppError('OMIE_HTTP_ERROR', 502, 'Omie retornou erro HTTP', { httpStatus: response.status, body: text });
            }
            try {
                const parsed = JSON.parse(text);
                return parsed;
            }
            catch (err) {
                throw new AppError_1.AppError('OMIE_PARSE_ERROR', 502, 'Resposta do Omie não é JSON válido', { sample: text.slice(0, 500) });
            }
        }
        catch (err) {
            clearTimeout(timeoutId);
            if (err instanceof AppError_1.AppError) {
                throw err;
            }
            throw new AppError_1.AppError('OMIE_NETWORK_ERROR', 502, 'Falha de rede/timeout ao chamar Omie', { message: err.message });
        }
    }
}
exports.OmieClient = OmieClient;
exports.omieClient = new OmieClient();
