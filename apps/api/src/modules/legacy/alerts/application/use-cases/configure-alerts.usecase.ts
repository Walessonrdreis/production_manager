import { AlertsRepositoryPort } from "../ports/alerts.repository.port";
import {
  AlertConfigRequest,
  AlertConfigResponse,
  AlertConfigRequestSchema,
} from "../dtos/stock-alerts.dto";

export interface ConfigureAlertsUseCaseDependencies {
  alertsRepository: AlertsRepositoryPort;
}

export class ConfigureAlertsUseCase {
  constructor(private readonly dependencies: ConfigureAlertsUseCaseDependencies) {}

  async execute(request: AlertConfigRequest): Promise<AlertConfigResponse> {
    // Validar request
    const validatedRequest = AlertConfigRequestSchema.parse(request);
    
    const { alertsRepository } = this.dependencies;
    
    // Verificar se já existe configuração para este produto
    let config;
    
    if (validatedRequest.productCode) {
      const existingConfig = await alertsRepository.getAlertConfigByProductCode(
        validatedRequest.productCode
      );
      
      if (existingConfig) {
        // Atualizar configuração existente
        config = await alertsRepository.updateAlertConfig(existingConfig.id, {
          criticalThreshold: validatedRequest.criticalThreshold,
          warningThreshold: validatedRequest.warningThreshold,
          notificationChannels: validatedRequest.notificationChannels,
          autoResolveDays: validatedRequest.autoResolveDays,
        });
      } else {
        // Criar nova configuração
        config = await alertsRepository.createAlertConfig({
          productCode: validatedRequest.productCode,
          criticalThreshold: validatedRequest.criticalThreshold || 5,
          warningThreshold: validatedRequest.warningThreshold || 10,
          notificationChannels: validatedRequest.notificationChannels || ["dashboard"],
          autoResolveDays: validatedRequest.autoResolveDays || 7,
        });
      }
    } else {
      // Configuração padrão (aplicável a todos os produtos)
      const defaultConfig = await alertsRepository.getDefaultAlertConfig();
      
      if (defaultConfig) {
        // Atualizar configuração padrão existente
        config = await alertsRepository.updateAlertConfig(defaultConfig.id, {
          criticalThreshold: validatedRequest.criticalThreshold,
          warningThreshold: validatedRequest.warningThreshold,
          notificationChannels: validatedRequest.notificationChannels,
          autoResolveDays: validatedRequest.autoResolveDays,
        });
      } else {
        // Criar nova configuração padrão
        config = await alertsRepository.createAlertConfig({
          criticalThreshold: validatedRequest.criticalThreshold || 5,
          warningThreshold: validatedRequest.warningThreshold || 10,
          notificationChannels: validatedRequest.notificationChannels || ["dashboard"],
          autoResolveDays: validatedRequest.autoResolveDays || 7,
        });
      }
    }
    
    return {
      success: true,
      message: validatedRequest.productCode
        ? `Configuração de alertas para produto ${validatedRequest.productCode} atualizada com sucesso`
        : "Configuração padrão de alertas atualizada com sucesso",
      data: {
        id: config.id,
        productCode: config.productCode,
        criticalThreshold: config.criticalThreshold,
        warningThreshold: config.warningThreshold,
        notificationChannels: config.notificationChannels,
        autoResolveDays: config.autoResolveDays,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export function createConfigureAlertsUseCase(
  dependencies: ConfigureAlertsUseCaseDependencies
): ConfigureAlertsUseCase {
  return new ConfigureAlertsUseCase(dependencies);
}