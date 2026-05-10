import { AlertsRepositoryPort } from "../ports/alerts.repository.port";
import {
  StockAlertsRequest,
  StockAlertsResponse,
  StockAlertsRequestSchema,
} from "../dtos/stock-alerts.dto";

export interface ListStockAlertsUseCaseDependencies {
  alertsRepository: AlertsRepositoryPort;
}

export class ListStockAlertsUseCase {
  constructor(private readonly dependencies: ListStockAlertsUseCaseDependencies) {}

  async execute(request: StockAlertsRequest): Promise<StockAlertsResponse> {
    // Validar request
    const validatedRequest = StockAlertsRequestSchema.parse(request);
    
    const { alertsRepository } = this.dependencies;
    
    // Buscar alertas com paginação
    const { alerts, total } = await alertsRepository.getStockAlerts(validatedRequest);
    
    // Calcular estatísticas
    const criticalCount = alerts.filter(a => a.severity === "critical").length;
    const warningCount = alerts.filter(a => a.severity === "warning").length;
    const infoCount = alerts.filter(a => a.severity === "info").length;
    const activeCount = alerts.filter(a => a.status === "active").length;
    const resolvedCount = alerts.filter(a => a.status === "resolved").length;
    
    // Calcular paginação
    const totalPages = Math.ceil(total / validatedRequest.pageSize);
    
    return {
      success: true,
      message: "Alertas de estoque recuperados com sucesso",
      data: {
        alerts: alerts.map(alert => ({
          id: alert.id,
          productCode: alert.productCode,
          productDescription: alert.productDescription,
          currentStock: alert.currentStock,
          minimumStock: alert.minimumStock,
          severity: alert.severity,
          status: alert.status,
          createdAt: alert.createdAt.toISOString(),
          resolvedAt: alert.resolvedAt?.toISOString(),
          metadata: alert.metadata,
        })),
        pagination: {
          page: validatedRequest.page,
          pageSize: validatedRequest.pageSize,
          totalItems: total,
          totalPages,
        },
        summary: {
          criticalCount,
          warningCount,
          infoCount,
          activeCount,
          resolvedCount,
        },
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export function createListStockAlertsUseCase(
  dependencies: ListStockAlertsUseCaseDependencies
): ListStockAlertsUseCase {
  return new ListStockAlertsUseCase(dependencies);
}