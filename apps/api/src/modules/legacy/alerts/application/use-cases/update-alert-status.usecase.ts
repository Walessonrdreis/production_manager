import { AlertsRepositoryPort } from "../ports/alerts.repository.port";
import {
  AlertStatusRequest,
  AlertStatusResponse,
  AlertStatusRequestSchema,
} from "../dtos/stock-alerts.dto";

export interface UpdateAlertStatusUseCaseDependencies {
  alertsRepository: AlertsRepositoryPort;
}

export class UpdateAlertStatusUseCase {
  constructor(private readonly dependencies: UpdateAlertStatusUseCaseDependencies) {}

  async execute(alertId: string, request: AlertStatusRequest): Promise<AlertStatusResponse> {
    // Validar request
    const validatedRequest = AlertStatusRequestSchema.parse(request);
    
    const { alertsRepository } = this.dependencies;
    
    // Verificar se o alerta existe
    const existingAlert = await alertsRepository.getStockAlertById(alertId);
    
    if (!existingAlert) {
      throw new Error(`Alerta com ID ${alertId} não encontrado`);
    }
    
    // Atualizar status do alerta
    let updatedAlert;
    
    if (validatedRequest.status === "resolved") {
      updatedAlert = await alertsRepository.resolveStockAlert(
        alertId,
        validatedRequest.notes
      );
    } else if (validatedRequest.status === "acknowledged") {
      updatedAlert = await alertsRepository.updateStockAlert(alertId, {
        status: "acknowledged",
      });
    } else {
      throw new Error(`Status inválido: ${validatedRequest.status}`);
    }
    
    return {
      success: true,
      message: `Status do alerta atualizado para ${validatedRequest.status}`,
      data: {
        id: updatedAlert.id,
        status: updatedAlert.status,
        resolvedAt: updatedAlert.resolvedAt?.toISOString(),
        notes: validatedRequest.notes,
        updatedAt: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export function createUpdateAlertStatusUseCase(
  dependencies: UpdateAlertStatusUseCaseDependencies
): UpdateAlertStatusUseCase {
  return new UpdateAlertStatusUseCase(dependencies);
}