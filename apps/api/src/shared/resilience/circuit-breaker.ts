// src/shared/resilience/circuit-breaker.ts
import { AppError } from "@/shared/errors/AppError";

export interface CircuitBreakerConfig {
  /**
   * Número máximo de falhas consecutivas antes de abrir o circuito
   * Default: 5
   */
  failureThreshold?: number;
  
  /**
   * Tempo em milissegundos que o circuito permanece aberto antes de tentar meio-abrir
   * Default: 30000 (30 segundos)
   */
  resetTimeoutMs?: number;
  
  /**
   * Número de tentativas bem-sucedidas necessárias para fechar o circuito completamente
   * Default: 3
   */
  successThreshold?: number;
  
  /**
   * Logger opcional para monitoramento
   */
  logger?: {
    info?: (obj: any, msg?: string) => void;
    warn?: (obj: any, msg?: string) => void;
    error?: (obj: any, msg?: string) => void;
  };
}

export interface CircuitBreakerMetrics {
  failures: number;
  successes: number;
  state: 'closed' | 'open' | 'half-open';
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
}

export class CircuitBreaker {
  private failures = 0;
  private successes = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  
  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly successThreshold: number;
  private readonly logger?: CircuitBreakerConfig['logger'];
  
  constructor(
    private readonly name: string,
    config: CircuitBreakerConfig = {}
  ) {
    this.failureThreshold = config.failureThreshold ?? 5;
    this.resetTimeoutMs = config.resetTimeoutMs ?? 30000;
    this.successThreshold = config.successThreshold ?? 3;
    this.logger = config.logger;
  }
  
  /**
   * Executa uma função protegida pelo circuit breaker
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Verifica se o circuito está aberto
    if (this.state === 'open') {
      const now = Date.now();
      const timeSinceLastFailure = this.lastFailureTime ? now - this.lastFailureTime : Infinity;
      
      // Se passou tempo suficiente, tenta meio-abrir
      if (timeSinceLastFailure >= this.resetTimeoutMs) {
        this.state = 'half-open';
        this.logger?.info?.({ circuit: this.name, state: this.state }, `Circuit ${this.name} half-open`);
      } else {
        // Circuito ainda aberto, rejeita imediatamente
        const remainingTime = this.resetTimeoutMs - timeSinceLastFailure;
        this.logger?.warn?.({ circuit: this.name, remainingTime }, `Circuit ${this.name} open, rejecting request`);
        throw new AppError(
          'CIRCUIT_BREAKER_OPEN',
          503,
          `Service ${this.name} temporarily unavailable`,
          { circuit: this.name, retryAfter: Math.ceil(remainingTime / 1000) }
        );
      }
    }
    
    try {
      // Executa a função
      const result = await fn();
      
      // Registra sucesso
      this.onSuccess();
      
      return result;
    } catch (error) {
      // Registra falha
      this.onFailure();
      
      // Re-lança o erro original
      throw error;
    }
  }
  
  /**
   * Registra uma falha
   */
  private onFailure(): void {
    this.failures++;
    this.successes = 0;
    this.lastFailureTime = Date.now();
    
    this.logger?.warn?.({ 
      circuit: this.name, 
      failures: this.failures,
      threshold: this.failureThreshold 
    }, `Circuit ${this.name} failure recorded`);
    
    // Se atingiu o threshold, abre o circuito
    if (this.failures >= this.failureThreshold && this.state !== 'open') {
      this.state = 'open';
      this.logger?.error?.({ circuit: this.name }, `Circuit ${this.name} opened`);
    }
    
    // Se está meio-aberto e falhou, volta a abrir
    if (this.state === 'half-open') {
      this.state = 'open';
      this.logger?.error?.({ circuit: this.name }, `Circuit ${this.name} re-opened from half-open`);
    }
  }
  
  /**
   * Registra um sucesso
   */
  private onSuccess(): void {
    this.successes++;
    this.lastSuccessTime = Date.now();
    
    this.logger?.info?.({ 
      circuit: this.name, 
      successes: this.successes,
      threshold: this.successThreshold 
    }, `Circuit ${this.name} success recorded`);
    
    // Se está meio-aberto e atingiu o threshold de sucesso, fecha o circuito
    if (this.state === 'half-open' && this.successes >= this.successThreshold) {
      this.state = 'closed';
      this.failures = 0;
      this.successes = 0;
      this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} closed`);
    }
    
    // Se está fechado, reseta contadores após sucessos consecutivos
    if (this.state === 'closed' && this.successes >= this.successThreshold) {
      this.failures = 0;
      this.successes = 0;
      this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} counters reset`);
    }
  }
  
  /**
   * Retorna métricas atuais
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      failures: this.failures,
      successes: this.successes,
      state: this.state,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
    };
  }
  
  /**
   * Reseta o circuit breaker para estado inicial
   */
  reset(): void {
    this.failures = 0;
    this.successes = 0;
    this.state = 'closed';
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    
    this.logger?.info?.({ circuit: this.name }, `Circuit ${this.name} reset`);
  }
}

/**
 * Factory para criar circuit breakers
 */
export function createCircuitBreaker(name: string, config?: CircuitBreakerConfig): CircuitBreaker {
  return new CircuitBreaker(name, config);
}