"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
exports.calculateBackoffWithJitter = calculateBackoffWithJitter;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
exports.sleep = sleep;
function calculateBackoffWithJitter(attempt, baseDelay = 500, maxJitter = 250) {
    // Exponencial: baseDelay * (2 ^ (attempt - 1))
    // Tentativa 1 (primeiro retry): 500 * 2^0 = 500ms
    // Tentativa 2 (segundo retry): 500 * 2^1 = 1000ms
    // Tentativa 3 (terceiro retry): 500 * 2^2 = 2000ms
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    // Jitter: valor aleatório entre 0 e maxJitter
    const jitter = Math.floor(Math.random() * maxJitter);
    return exponentialDelay + jitter;
}
