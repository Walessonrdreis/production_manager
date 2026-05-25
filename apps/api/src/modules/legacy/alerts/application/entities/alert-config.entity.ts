export interface AlertConfig {
  id: string;
  productCode?: string; // Se undefined, é configuração padrão
  criticalThreshold: number;
  warningThreshold: number;
  notificationChannels: Array<"email" | "sms" | "dashboard">;
  autoResolveDays: number;
  createdAt: Date;
  updatedAt: Date;
}

export function createAlertConfig(params: Omit<AlertConfig, "id" | "createdAt" | "updatedAt">): AlertConfig {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    ...params,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateAlertConfig(config: AlertConfig, updates: Partial<AlertConfig>): AlertConfig {
  return {
    ...config,
    ...updates,
    updatedAt: new Date(),
  };
}