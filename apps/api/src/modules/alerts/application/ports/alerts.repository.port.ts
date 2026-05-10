import { StockAlert } from "../entities/stock-alert.entity";
import { AlertConfig } from "../entities/alert-config.entity";
import { StockAlertsRequest } from "../dtos/stock-alerts.dto";

export interface AlertsRepositoryPort {
  // Alertas de estoque
  createStockAlert(alert: Omit<StockAlert, "id" | "createdAt">): Promise<StockAlert>;
  updateStockAlert(id: string, updates: Partial<StockAlert>): Promise<StockAlert>;
  getStockAlertById(id: string): Promise<StockAlert | null>;
  getStockAlerts(params: StockAlertsRequest): Promise<{
    alerts: StockAlert[];
    total: number;
  }>;
  getActiveStockAlerts(): Promise<StockAlert[]>;
  resolveStockAlert(id: string, notes?: string): Promise<StockAlert>;
  
  // Configurações de alerta
  createAlertConfig(config: Omit<AlertConfig, "id" | "createdAt" | "updatedAt">): Promise<AlertConfig>;
  updateAlertConfig(id: string, updates: Partial<AlertConfig>): Promise<AlertConfig>;
  getAlertConfigById(id: string): Promise<AlertConfig | null>;
  getAlertConfigByProductCode(productCode: string): Promise<AlertConfig | null>;
  getDefaultAlertConfig(): Promise<AlertConfig | null>;
  listAlertConfigs(): Promise<AlertConfig[]>;
  
  // Métricas e estatísticas
  getAlertStats(): Promise<{
    totalAlerts: number;
    activeAlerts: number;
    resolvedAlerts: number;
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    byProduct: Array<{
      productCode: string;
      productDescription: string;
      alertCount: number;
    }>;
  }>;
  
  // Limpeza de alertas antigos
  cleanupOldAlerts(days: number): Promise<number>;
}