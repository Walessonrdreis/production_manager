import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { IntelligentPollingService, PollingJobConfig, PollingJobHandler } from "./IntelligentPollingService";
import { Logger } from "@/shared/logger ";

const mockLogger: Logger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  child: vi.fn(() => mockLogger),
} as any;

describe("IntelligentPollingService", () => {
  let service: IntelligentPollingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IntelligentPollingService(mockLogger);
  });

  afterEach(() => {
    service.stopAllJobs();
  });

  describe("registerJob", () => {
    it("deve registrar um job com configuração válida", () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      service.registerJob(config);

      const status = service.getJobStatus("test-job");
      expect(status).toBeTruthy();
      expect(status?.name).toBe("test-job");
      expect(status?.currentIntervalMs).toBe(1000);
      expect(mockLogger.info).toHaveBeenCalledWith(
        { jobName: "test-job" },
        "Job registered"
      );
    });

    it("não deve permitir registrar job com nome duplicado", () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      service.registerJob(config);
      service.registerJob(config);

      const status = service.getJobStatus("test-job");
      expect(status).toBeTruthy();
      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });
  });

  describe("startJob", () => {
    it("deve iniciar um job registrado e habilitado", async () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          durationMs: 100,
          data: { test: "data" },
        }),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { jobName: "test-job" },
        "Job started"
      );
    });

    it("não deve iniciar um job desabilitado", async () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: false,
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn(),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      expect(mockLogger.info).toHaveBeenCalledWith(
        { jobName: "test-job" },
        "Job disabled, not starting"
      );
      expect(mockHandler.execute).not.toHaveBeenCalled();
    });

    it("deve lançar erro ao tentar iniciar job não registrado", async () => {
      const mockHandler: PollingJobHandler = {
        execute: vi.fn(),
      };

      await expect(
        service.startJob("non-existent-job", mockHandler)
      ).rejects.toThrow("Job non-existent-job not registered");
    });
  });

  describe("stopJob", () => {
    it("deve parar um job em execução", async () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          durationMs: 100,
        }),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);
      service.stopJob("test-job");

      expect(mockLogger.info).toHaveBeenCalledWith(
        { jobName: "test-job" },
        "Job stopped"
      );
    });

    it("não deve lançar erro ao parar job não existente", () => {
      expect(() => service.stopJob("non-existent-job")).not.toThrow();
    });
  });

  describe("stopAllJobs", () => {
    it("deve parar todos os jobs em execução", async () => {
      const config1: PollingJobConfig = {
        name: "test-job-1",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const config2: PollingJobConfig = {
        name: "test-job-2",
        baseIntervalMs: 2000,
        maxIntervalMs: 10000,
        criticality: "medium",
        enabled: true,
      };

      const mockHandler1: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          durationMs: 100,
        }),
      };

      const mockHandler2: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          durationMs: 200,
        }),
      };

      service.registerJob(config1);
      service.registerJob(config2);
      await service.startJob("test-job-1", mockHandler1);
      await service.startJob("test-job-2", mockHandler2);

      service.stopAllJobs();

      expect(mockLogger.info).toHaveBeenCalledWith(
        {},
        "All jobs stopped"
      );
    });
  });

  describe("getJobStatus", () => {
    it("deve retornar status de job registrado", () => {
      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      service.registerJob(config);
      const status = service.getJobStatus("test-job");

      expect(status).toBeTruthy();
      expect(status?.name).toBe("test-job");
      expect(status?.currentIntervalMs).toBe(1000);
      expect(status?.isRunning).toBe(false);
      expect(status?.lastRunAt).toBeNull();
      expect(status?.lastSuccessAt).toBeNull();
      expect(status?.lastError).toBeNull();
      expect(status?.consecutiveFailures).toBe(0);
    });

    it("deve retornar null para job não registrado", () => {
      const status = service.getJobStatus("non-existent-job");
      expect(status).toBeNull();
    });
  });

  describe("getAllJobStatuses", () => {
    it("deve retornar status de todos os jobs registrados", () => {
      const config1: PollingJobConfig = {
        name: "test-job-1",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const config2: PollingJobConfig = {
        name: "test-job-2",
        baseIntervalMs: 2000,
        maxIntervalMs: 10000,
        criticality: "medium",
        enabled: true,
      };

      service.registerJob(config1);
      service.registerJob(config2);

      const statuses = service.getAllJobStatuses();
      expect(statuses).toHaveLength(2);
      expect(statuses[0].name).toBe("test-job-1");
      expect(statuses[1].name).toBe("test-job-2");
    });

    it("deve retornar array vazio quando não há jobs registrados", () => {
      const statuses = service.getAllJobStatuses();
      expect(statuses).toHaveLength(0);
    });
  });

  describe("calculateBackoffInterval", () => {
    it("deve retornar intervalo base quando não há falhas consecutivas", () => {
      const serviceWithPrivate = service as any;
      const interval = serviceWithPrivate.calculateBackoffInterval(1000, 5000, 0);
      expect(interval).toBe(1000);
    });

    it("deve calcular backoff exponencial para falhas consecutivas", () => {
      const serviceWithPrivate = service as any;
      
      const interval1 = serviceWithPrivate.calculateBackoffInterval(1000, 5000, 1);
      expect(interval1).toBe(1000); // 1000 * 2^0

      const interval2 = serviceWithPrivate.calculateBackoffInterval(1000, 5000, 2);
      expect(interval2).toBe(2000); // 1000 * 2^1

      const interval3 = serviceWithPrivate.calculateBackoffInterval(1000, 5000, 3);
      expect(interval3).toBe(4000); // 1000 * 2^2

      const interval4 = serviceWithPrivate.calculateBackoffInterval(1000, 5000, 4);
      expect(interval4).toBe(5000); // 1000 * 2^3 = 8000, mas limitado a 5000
    });

    it("deve limitar intervalo ao máximo configurado", () => {
      const serviceWithPrivate = service as any;
      const interval = serviceWithPrivate.calculateBackoffInterval(1000, 3000, 5);
      expect(interval).toBe(3000); // Limitado a 3000
    });
  });

  describe("execução de job com sucesso", () => {
    it("deve executar job e atualizar status com sucesso", async () => {
      vi.useFakeTimers();

      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: true,
          durationMs: 100,
          data: { test: "data" },
        }),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      await vi.advanceTimersByTimeAsync(1500);

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      
      const status = service.getJobStatus("test-job");
      expect(status?.lastSuccessAt).toBeTruthy();
      expect(status?.consecutiveFailures).toBe(0);
      expect(status?.currentIntervalMs).toBe(1000);
      expect(status?.lastError).toBeNull();

      vi.useRealTimers();
    });
  });

  describe("execução de job com falha", () => {
    it("deve executar job e atualizar status com falha", async () => {
      vi.useFakeTimers();

      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
        retryConfig: {
          maxRetries: 0, // Desabilitar retry para testar falha direta
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffFactor: 2,
          jitterFactor: 0.1,
          circuitBreakerThreshold: 5,
          circuitBreakerResetMs: 5000,
        },
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          durationMs: 100,
          error: "Test error",
        }),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      await vi.advanceTimersByTimeAsync(1500);

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      
      const status = service.getJobStatus("test-job");
      expect(status?.consecutiveFailures).toBe(1);
      expect(status?.currentIntervalMs).toBe(1000); // Ainda 1000 pois 1000 * 2^0 = 1000
      expect(status?.lastError).toBe("Test error");

      vi.useRealTimers();
    });

    it("deve aumentar intervalo com falhas consecutivas", async () => {
      vi.useFakeTimers();

      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
        retryConfig: {
          maxRetries: 0, // Desabilitar retry para testar falha direta
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffFactor: 2,
          jitterFactor: 0.1,
          circuitBreakerThreshold: 5,
          circuitBreakerResetMs: 5000,
        },
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockResolvedValue({
          success: false,
          durationMs: 100,
          error: "Test error",
        }),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      // Avançar tempo para 3 execuções (1000ms cada)
      await vi.advanceTimersByTimeAsync(1500); // Primeira execução
      await vi.advanceTimersByTimeAsync(1500); // Segunda execução (total 3000ms)
      await vi.advanceTimersByTimeAsync(1500); // Terceira execução (total 4500ms)

      expect(mockHandler.execute).toHaveBeenCalledTimes(3);
      
      const status = service.getJobStatus("test-job");
      expect(status?.consecutiveFailures).toBe(3);
      expect(status?.currentIntervalMs).toBe(4000); // 1000 * 2^2 = 4000

      vi.useRealTimers();
    });
  });

  describe("execução de job com exceção", () => {
    it("deve tratar exceção e atualizar status", async () => {
      vi.useFakeTimers();

      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
        retryConfig: {
          maxRetries: 0, // Desabilitar retry para testar falha direta
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffFactor: 2,
          jitterFactor: 0.1,
          circuitBreakerThreshold: 5,
          circuitBreakerResetMs: 5000,
        },
      };

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockRejectedValue(new Error("Unexpected error")),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      await vi.advanceTimersByTimeAsync(1500);

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      
      const status = service.getJobStatus("test-job");
      expect(status?.consecutiveFailures).toBe(1);
      expect(status?.lastError).toBe("Unexpected error");

      vi.useRealTimers();
    });
  });

  describe("evitar execução concorrente", () => {
    it("não deve executar job se já estiver em execução", async () => {
      vi.useFakeTimers();

      const config: PollingJobConfig = {
        name: "test-job",
        baseIntervalMs: 1000,
        maxIntervalMs: 5000,
        criticality: "high",
        enabled: true,
        retryConfig: {
          maxRetries: 0, // Desabilitar retry para testar falha direta
          initialDelayMs: 100,
          maxDelayMs: 1000,
          backoffFactor: 2,
          jitterFactor: 0.1,
          circuitBreakerThreshold: 5,
          circuitBreakerResetMs: 5000,
        },
      };

      let resolveExecution: (value: any) => void;
      const executionPromise = new Promise(resolve => {
        resolveExecution = resolve;
      });

      const mockHandler: PollingJobHandler = {
        execute: vi.fn().mockImplementation(() => executionPromise),
      };

      service.registerJob(config);
      await service.startJob("test-job", mockHandler);

      // Primeira execução - job fica pendente
      await vi.advanceTimersByTimeAsync(1500);
      
      // Verificar que o job está em execução
      const status = service.getJobStatus("test-job");
      expect(status?.isRunning).toBe(true);
      
      // Tentar forçar uma segunda execução manualmente
      // Isso simula o que aconteceria se o timer tentasse executar novamente
      await service["executeJobWithRetry"]("test-job", mockHandler);

      expect(mockHandler.execute).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { jobName: "test-job" },
        "Job already running, skipping retry"
      );

      // Resolver a primeira execução
      resolveExecution!({
        success: true,
        durationMs: 100,
      });

      vi.useRealTimers();
    });
  });
});