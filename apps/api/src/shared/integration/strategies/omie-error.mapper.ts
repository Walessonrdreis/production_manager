// ---------------------------------------------------------------------------
// Omie Error Mapper
// ---------------------------------------------------------------------------
// Utilitário para detectar, classificar e construir erros a partir de
// respostas da API Omie. Segue o padrão AppError do projeto.
//
// Uso típico em gateways:
//   try {
//     const resp = await this.omieClient.post(...);
//     if (isOmieErrorResponse(resp)) {
//       if (isRedundantFault(resp.faultstring)) {
//         throw buildOmieRedundantError(resp.faultstring, resp);
//       }
//       throw buildOmieFaultError(resp.faultstring ?? "Unknown Omie error", resp);
//     }
//     return resp;
//   } catch (error: unknown) {
//     if (error instanceof OmieRedundantError) throw error;
//     if (error instanceof OmieFaultError) throw error;
//     // Tratar OMIE_HTTP_ERROR com sample JSON
//     if (isOmieHttpErrorWithSample(error)) {
//       const mapped = mapHttpErrorToOmieError(error);
//       if (mapped) throw mapped;
//     }
//     throw error;
//   }
// ---------------------------------------------------------------------------

import { AppError } from "@/shared/errors/AppError";

// ─── Error Classes ───────────────────────────────────────────────────────

export class OmieFaultError extends AppError {
    constructor(message: string, details?: unknown) {
        super("OMIE_FAULT", 502, message, details);
        this.name = "OmieFaultError";
    }
}

export class OmieRedundantError extends AppError {
    public readonly retryAfterSeconds: number;

    constructor(faultstring: string, retryAfterSeconds: number, details?: unknown) {
        super("OMIE_REDUNDANT", 429, faultstring, details);
        this.name = "OmieRedundantError";
        this.retryAfterSeconds = retryAfterSeconds;
    }
}

// ─── Error Detection ────────────────────────────────────────────────────

/**
 * Detecta se um payload de resposta Omie contém indicadores de erro.
 */
export function isOmieErrorResponse(resp: unknown): boolean {
    if (!resp || typeof resp !== "object") return false;
    const r = resp as Record<string, unknown>;
    return Boolean(r.faultstring) || r.status === "error";
}

/**
 * Detecta se o faultstring contém REDUNDANT (rate-limit Omie).
 */
export function isRedundantFault(faultstring?: string): faultstring is string {
    return typeof faultstring === "string" && /REDUNDANT/i.test(faultstring);
}

/**
 * Extrai "Aguarde N segundos" do faultstring.
 */
export function parseRetryAfterSecondsFromFault(faultstring?: string): number | null {
    if (!faultstring) return null;
    const match = faultstring.match(/aguarde\s+(\d+)\s+segundos/i);
    if (!match) return null;
    const n = Number(match[1]);
    return Number.isFinite(n) ? n : null;
}

// ─── Error Builders ──────────────────────────────────────────────────────

/**
 * Constrói OmieFaultError a partir de faultstring + detalhes.
 */
export function buildOmieFaultError(message: string, details?: unknown): OmieFaultError {
    return new OmieFaultError(message, details);
}

/**
 * Constrói OmieRedundantError com retryAfterSeconds extraído do faultstring.
 * Se não conseguir extrair, usa 60s como fallback.
 */
export function buildOmieRedundantError(faultstring: string, details?: unknown): OmieRedundantError {
    const retryAfterSeconds = parseRetryAfterSecondsFromFault(faultstring) ?? 60;
    return new OmieRedundantError(faultstring, retryAfterSeconds, details);
}

// ─── HTTP Error Mapping ─────────────────────────────────────────────────

/**
 * Verifica se o erro lançado é um OMIE_HTTP_ERROR com sample parseável.
 */
export function isOmieHttpErrorWithSample(error: unknown): error is { code: string; details: { sample?: string } } {
    if (!error || typeof error !== "object") return false;
    const e = error as Record<string, unknown>;
    const details = e.details as Record<string, unknown> | undefined;
    return e.code === "OMIE_HTTP_ERROR" && typeof details?.sample === "string";
}

/**
 * Tenta fazer JSON.parse seguro de uma string.
 */
function safeJsonParse(raw: string): unknown | null {
    try {
        return JSON.parse(raw) as unknown;
    } catch {
        return null;
    }
}

/**
 * Mapeia um OMIE_HTTP_ERROR com sample para OmieFaultError ou OmieRedundantError.
 * Retorna null se não conseguir mapear (erro não-Omie).
 */
export function mapHttpErrorToOmieError(
    error: { code: string; details: { sample?: string } }
): OmieFaultError | OmieRedundantError | null {
    if (!error.details?.sample) return null;

    const parsed = safeJsonParse(error.details.sample);
    if (!parsed || typeof parsed !== "object") return null;

    const p = parsed as Record<string, unknown>;
    const faultstring = String(p.faultstring ?? p.message ?? "");

    if (!faultstring || faultstring === "undefined") return null;

    if (isRedundantFault(faultstring)) {
        return buildOmieRedundantError(faultstring, { parsed, originalError: error });
    }

    return buildOmieFaultError(faultstring, { parsed, originalError: error });
}
