// apps/api/src/shared/integrations/omie/omie-http-client.port.ts

export interface OmieHttpClientPort {
  post<T>(path: string, payload: unknown): Promise<T>;

  // observabilidade / infra
  getCircuitBreakerMetrics(): any;
  resetCircuitBreaker(): void;
}