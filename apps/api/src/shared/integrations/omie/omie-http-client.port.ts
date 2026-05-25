/**
 * Porta mínima do client Omie usada pelos gateways.
 * Serve tanto para OmieClient "puro" quanto para wrappers (circuit breaker, etc.).
 */
export interface OmieHttpClientPort {
  post<T>(path: string, payload: any): Promise<T>;
}
