import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createProductionOrderController } from '../../../../src/modules/integration/presentation/http/controllers/create-production-order.controller';
import { CreateProductionOrderUseCase } from '../../../../src/modules/integration/application/use-cases/create-production-order.usecase';

describe('Integration Module: POST /v1/integration/production-order', () => {
  let mockUseCase: any;
  let mockRequest: any;
  let mockReply: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Criar instância mock do UseCase
    mockUseCase = {
      execute: vi.fn(),
    };
    
    // Mock do request e reply do Fastify
    mockRequest = {
      body: {},
    };
    
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe('Sucesso (202)', () => {
    it('deve retornar 202 com payload válido', async () => {
      // Arrange
      const validPayload = {
        productId: 'PROD-001',
        quantity: 10,
        externalRequestId: 'req-12345',
        scheduledDate: '2026-05-22T10:00:00Z',
        notes: 'Test order',
      };

      const mockResponse = {
        success: true,
        data: {
          externalRequestId: validPayload.externalRequestId,
          status: 'ACCEPTED' as const,
        },
      };

      mockUseCase.execute.mockResolvedValue(mockResponse);
      mockRequest.body = validPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(202);
      expect(mockReply.send).toHaveBeenCalledWith(mockResponse);
      expect(mockUseCase.execute).toHaveBeenCalledWith(validPayload);
    });

    it('deve retornar 202 com payload mínimo (sem campos opcionais)', async () => {
      // Arrange
      const minimalPayload = {
        productId: 'PROD-002',
        quantity: 5,
        externalRequestId: 'req-67890',
      };

      const mockResponse = {
        success: true,
        data: {
          externalRequestId: minimalPayload.externalRequestId,
          status: 'ACCEPTED' as const,
        },
      };

      mockUseCase.execute.mockResolvedValue(mockResponse);
      mockRequest.body = minimalPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(202);
      expect(mockReply.send).toHaveBeenCalledWith(mockResponse);
      expect(mockUseCase.execute).toHaveBeenCalledWith(minimalPayload);
    });
  });

  describe('Erro de validação (400)', () => {
    it('deve retornar 400 quando faltar externalRequestId', async () => {
      // Arrange
      const invalidPayload = {
        productId: 'PROD-001',
        quantity: 10,
        // externalRequestId faltando
      };

      mockRequest.body = invalidPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
      });
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando quantity for inválido (negativo)', async () => {
      // Arrange
      const invalidPayload = {
        productId: 'PROD-001',
        quantity: -5, // quantidade negativa
        externalRequestId: 'req-12345',
      };

      mockRequest.body = invalidPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
      });
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });

    it('deve retornar 400 quando scheduledDate for inválido', async () => {
      // Arrange
      const invalidPayload = {
        productId: 'PROD-001',
        quantity: 10,
        externalRequestId: 'req-12345',
        scheduledDate: 'data-invalida', // formato inválido
      };

      mockRequest.body = invalidPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
      });
      expect(mockUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('Erro interno (500)', () => {
    it('deve retornar 500 quando o UseCase lançar exceção', async () => {
      // Arrange
      const validPayload = {
        productId: 'PROD-001',
        quantity: 10,
        externalRequestId: 'req-12345',
      };

      // Simular erro no UseCase
      mockUseCase.execute.mockRejectedValue(new Error('Erro interno'));
      mockRequest.body = validPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      // Assert
      expect(mockReply.code).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      });
      expect(mockUseCase.execute).toHaveBeenCalledWith(validPayload);
    });
  });

  describe('Contrato do response', () => {
    it('deve retornar shape correto para sucesso', async () => {
      // Arrange
      const validPayload = {
        productId: 'PROD-001',
        quantity: 10,
        externalRequestId: 'req-12345',
      };

      const mockResponse = {
        success: true,
        data: {
          externalRequestId: validPayload.externalRequestId,
          status: 'ACCEPTED' as const,
        },
      };

      mockUseCase.execute.mockResolvedValue(mockResponse);
      mockRequest.body = validPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      const responseSent = mockReply.send.mock.calls[0][0];

      // Assert
      expect(responseSent.success).toBe(true);
      expect(responseSent.data).toBeDefined();
      expect(responseSent.data.externalRequestId).toBe(validPayload.externalRequestId);
      expect(responseSent.data.status).toBe('ACCEPTED');
    });

    it('deve retornar shape correto para erro de validação', async () => {
      // Arrange
      const invalidPayload = {
        productId: 'PROD-001',
        // quantity faltando
        externalRequestId: 'req-12345',
      };

      mockRequest.body = invalidPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      const responseSent = mockReply.send.mock.calls[0][0];

      // Assert
      expect(responseSent.success).toBe(false);
      expect(responseSent.error).toBe('VALIDATION_ERROR');
      expect(responseSent.message).toBeDefined();
    });

    it('deve retornar shape correto para erro interno', async () => {
      // Arrange
      const validPayload = {
        productId: 'PROD-001',
        quantity: 10,
        externalRequestId: 'req-12345',
      };

      mockUseCase.execute.mockRejectedValue(new Error('Erro interno'));
      mockRequest.body = validPayload;

      // Act
      await createProductionOrderController(mockRequest, mockReply, mockUseCase);

      const responseSent = mockReply.send.mock.calls[0][0];

      // Assert
      expect(responseSent.success).toBe(false);
      expect(responseSent.error).toBe('INTERNAL_ERROR');
      expect(responseSent.message).toBeDefined();
    });
  });
});