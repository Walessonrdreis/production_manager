// src/shared/integrations/omie/omie-client-with-circuit-breaker.ts
import { createCircuitBreaker, CircuitBreaker } from "@/shared/resilience/circuit-breaker";
import { OmieClient, OmieClientConfig, OmieLogger } from "./omie.client";

export interface OmieClientWithCircuitBreakerConfig extends OmieClientConfig {
  /**
   * Configuração do circuit breaker
   */
  circuitBreaker?: {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    successThreshold?: number;
  };
}

export class OmieClientWithCircuitBreaker {
  private readonly client: OmieClient;
  private readonly circuitBreaker: CircuitBreaker;
  
  constructor(
    config: OmieClientWithCircuitBreakerConfig,
    logger?: OmieLogger
  ) {
    this.client = new OmieClient(config, logger);
    
    // Cria circuit breaker para a API Omie
    this.circuitBreaker = createCircuitBreaker('omie-api', {
      failureThreshold: config.circuitBreaker?.failureThreshold ?? 5,
      resetTimeoutMs: config.circuitBreaker?.resetTimeoutMs ?? 60000, // 1 minuto
      successThreshold: config.circuitBreaker?.successThreshold ?? 3,
      logger: logger,
    });
  }
  
  /**
   * Executa uma requisição POST protegida pelo circuit breaker
   */
  async post<T>(path: string, payload: any): Promise<T> {
    return this.circuitBreaker.execute(() => 
      this.client.post<T>(path, payload)
    );
  }
  
  /**
   * Retorna métricas do circuit breaker
   */
  getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }
  
  /**
   * Reseta o circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }
}

/**
 * Factory para criar OmieClient com circuit breaker
 */
export function createOmieClientWithCircuitBreaker(
  config: OmieClientWithCircuitBreakerConfig,
  logger?: OmieLogger
): OmieClientWithCircuitBreaker {
  return new OmieClientWithCircuitBreaker(config, logger);
}