/**
 * Utilitários para garantir idempotência em processos de sincronização
 * 
 * Princípios:
 * 1. Usar identificadores únicos (ex: id do Omie) como chave
 * 2. Evitar inserts duplicados
 * 3. Usar upsert sempre que possível
 * 4. Implementar locks distribuídos para jobs
 */

import { AppError } from "@/shared/errors/AppError";

/**
 * Interface para operações idempotentes
 */
export interface IdempotentOperation<T> {
  /**
   * Identificador único da operação
   */
  id: string;
  
  /**
   * Dados da operação
   */
  data: T;
  
  /**
   * Timestamp da operação (para detecção de duplicatas recentes)
   */
  timestamp?: Date;
}

/**
 * Configuração para detecção de duplicatas
 */
export interface DuplicateDetectionConfig {
  /**
   * Janela de tempo para considerar duplicata (em milissegundos)
   * Default: 5 minutos (300000ms)
   */
  timeWindowMs?: number;
  
  /**
   * Se true, lança erro quando detecta duplicata
   * Se false, apenas retorna null ou valor existente
   */
  throwOnDuplicate?: boolean;
  
  /**
   * Mensagem de erro personalizada
   */
  duplicateErrorMessage?: string;
}

/**
 * Verifica se uma operação é duplicada baseada em cache em memória
 * Útil para prevenir processamento duplicado dentro de uma mesma execução
 */
export class InMemoryDuplicateDetector {
  private processedIds = new Map<string, number>();
  private readonly timeWindowMs: number;

  constructor(config?: DuplicateDetectionConfig) {
    this.timeWindowMs = config?.timeWindowMs || 300000; // 5 minutos
  }

  /**
   * Verifica se um ID já foi processado recentemente
   */
  isDuplicate(id: string): boolean {
    const lastProcessed = this.processedIds.get(id);
    if (!lastProcessed) {
      return false;
    }

    const now = Date.now();
    const isRecent = (now - lastProcessed) < this.timeWindowMs;
    
    // Limpa IDs antigos
    if (!isRecent) {
      this.processedIds.delete(id);
      return false;
    }

    return true;
  }

  /**
   * Marca um ID como processado
   */
  markAsProcessed(id: string): void {
    this.processedIds.set(id, Date.now());
  }

  /**
   * Executa uma operação apenas se não for duplicata
   */
  async executeIfNotDuplicate<T>(
    id: string,
    operation: () => Promise<T>,
    config?: DuplicateDetectionConfig
  ): Promise<T | null> {
    if (this.isDuplicate(id)) {
      const throwOnDuplicate = config?.throwOnDuplicate ?? false;
      const errorMessage = config?.duplicateErrorMessage || `Operação duplicada detectada para ID: ${id}`;
      
      if (throwOnDuplicate) {
        throw new AppError("DUPLICATE_OPERATION", 409, errorMessage, { id });
      }
      
      return null;
    }

    try {
      const result = await operation();
      this.markAsProcessed(id);
      return result;
    } catch (error) {
      // Não marca como processado em caso de erro
      throw error;
    }
  }

  /**
   * Limpa o cache de IDs processados
   */
  clear(): void {
    this.processedIds.clear();
  }
}

/**
 * Estratégias comuns para garantir idempotência
 */
export class IdempotencyStrategies {
  /**
   * Estratégia de upsert com identificador único
   * Recomendada para sincronização de dados
   */
  static async upsertWithUniqueId<T>(
    repository: {
      upsert: (data: T, uniqueId: string) => Promise<void>;
      findByUniqueId: (uniqueId: string) => Promise<T | null>;
    },
    data: T,
    uniqueId: string,
    duplicateCheck: boolean = true
  ): Promise<void> {
    if (duplicateCheck) {
      const existing = await repository.findByUniqueId(uniqueId);
      if (existing) {
        // Verifica se os dados são diferentes antes de atualizar
        const existingJson = JSON.stringify(existing);
        const newJson = JSON.stringify(data);
        
        if (existingJson === newJson) {
          // Dados idênticos, não precisa atualizar
          return;
        }
      }
    }

    await repository.upsert(data, uniqueId);
  }

  /**
   * Estratégia de processamento com lock distribuído
   * Previne execução simultânea do mesmo job
   */
  static async withDistributedLock<T>(
    lockService: {
      acquire: (key: string, ttlMs: number) => Promise<boolean>;
      release: (key: string) => Promise<void>;
    },
    lockKey: string,
    lockTtlMs: number,
    operation: () => Promise<T>
  ): Promise<T | null> {
    const acquired = await lockService.acquire(lockKey, lockTtlMs);
    
    if (!acquired) {
      return null; // Outra instância já está processando
    }

    try {
      const result = await operation();
      return result;
    } finally {
      await lockService.release(lockKey);
    }
  }

  /**
   * Estratégia de idempotência baseada em timestamp
   * Útil para operações que podem ser repetidas mas não devem ser processadas novamente
   * dentro de uma janela de tempo
   */
  static async withTimestampCheck<T>(
    storage: {
      getLastProcessedTimestamp: (key: string) => Promise<Date | null>;
      setLastProcessedTimestamp: (key: string, timestamp: Date) => Promise<void>;
    },
    key: string,
    minIntervalMs: number,
    operation: () => Promise<T>
  ): Promise<T | null> {
    const lastProcessed = await storage.getLastProcessedTimestamp(key);
    const now = new Date();

    if (lastProcessed) {
      const timeSinceLast = now.getTime() - lastProcessed.getTime();
      if (timeSinceLast < minIntervalMs) {
        return null; // Ainda não passou tempo suficiente
      }
    }

    try {
      const result = await operation();
      await storage.setLastProcessedTimestamp(key, now);
      return result;
    } catch (error) {
      // Não atualiza timestamp em caso de erro
      throw error;
    }
  }
}

/**
 * Decorator para garantir idempotência em métodos
 */
export function Idempotent(config?: {
  key?: string;
  timeWindowMs?: number;
  throwOnDuplicate?: boolean;
}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const detector = new InMemoryDuplicateDetector({
      timeWindowMs: config?.timeWindowMs,
      throwOnDuplicate: config?.throwOnDuplicate,
    });

    descriptor.value = async function (...args: any[]) {
      // Gera uma chave única baseada no método e argumentos
      const key = config?.key || `${propertyKey}:${JSON.stringify(args)}`;
      
      return detector.executeIfNotDuplicate(
        key,
        () => originalMethod.apply(this, args),
        {
          throwOnDuplicate: config?.throwOnDuplicate,
          duplicateErrorMessage: `Método ${propertyKey} já foi executado recentemente com os mesmos argumentos`,
        }
      );
    };

    return descriptor;
  };
}

/**
 * Utilitário para criar operações idempotentes
 */
export function createIdempotentOperation<T>(
  id: string,
  data: T,
  timestamp?: Date
): IdempotentOperation<T> {
  return {
    id,
    data,
    timestamp: timestamp || new Date(),
  };
}

/**
 * Verifica se uma operação deve ser processada baseada em regras de idempotência
 */
export function shouldProcessOperation<T>(
  operation: IdempotentOperation<T>,
  existingOperation?: IdempotentOperation<T>,
  config?: DuplicateDetectionConfig
): boolean {
  if (!existingOperation) {
    return true; // Não existe operação anterior
  }

  const timeWindowMs = config?.timeWindowMs || 300000;
  
  if (operation.timestamp && existingOperation.timestamp) {
    const timeDiff = operation.timestamp.getTime() - existingOperation.timestamp.getTime();
    
    if (timeDiff < timeWindowMs) {
      // Operação dentro da janela de tempo, verifica se os dados são diferentes
      const existingDataJson = JSON.stringify(existingOperation.data);
      const newDataJson = JSON.stringify(operation.data);
      
      return existingDataJson !== newDataJson;
    }
  }

  return true; // Fora da janela de tempo ou sem timestamp
}