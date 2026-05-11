export interface ProductionQueueItem {
  id: string;
  orderId: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  position: number;
  estimatedStartDate?: Date;
  scheduledDate?: Date;
  notes?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ProductionQueueStatistics {
  totalOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageCompletionTime?: number; // em horas
  priorityDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  dailyThroughput?: Array<{
    date: string;
    completed: number;
  }>;
}

export interface QueueReorderItem {
  id: string;
  newPosition: number;
}

export function createProductionQueueItem(
  params: Omit<ProductionQueueItem, "id" | "createdAt" | "updatedAt">
): Omit<ProductionQueueItem, "id" | "createdAt" | "updatedAt"> {
  return {
    orderId: params.orderId,
    priority: params.priority,
    status: params.status,
    position: params.position,
    estimatedStartDate: params.estimatedStartDate,
    scheduledDate: params.scheduledDate,
    notes: params.notes,
    completedAt: params.completedAt,
    metadata: params.metadata,
  };
}

export function calculateEstimatedStartDate(
  currentPosition: number,
  averageProcessingTime: number = 2, // horas por ordem
  workingHoursPerDay: number = 8,
  currentDate: Date = new Date()
): Date {
  // Calcular horas totais até esta posição
  const totalHours = currentPosition * averageProcessingTime;
  
  // Calcular dias de trabalho necessários
  const workDays = Math.ceil(totalHours / workingHoursPerDay);
  
  // Adicionar dias de trabalho (ignorando fins de semana)
  const estimatedDate = new Date(currentDate);
  let daysAdded = 0;
  
  while (daysAdded < workDays) {
    estimatedDate.setDate(estimatedDate.getDate() + 1);
    
    // Ignorar fins de semana (sábado = 6, domingo = 0)
    const dayOfWeek = estimatedDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++;
    }
  }
  
  return estimatedDate;
}

export function validateQueuePriority(priority: string): priority is "high" | "medium" | "low" {
  return ["high", "medium", "low"].includes(priority);
}

export function validateQueueStatus(status: string): status is "pending" | "in_progress" | "completed" | "cancelled" {
  return ["pending", "in_progress", "completed", "cancelled"].includes(status);
}

export function getPriorityWeight(priority: "high" | "medium" | "low"): number {
  const weights = {
    high: 3,
    medium: 2,
    low: 1,
  };
  
  return weights[priority];
}

export function compareQueueItems(a: ProductionQueueItem, b: ProductionQueueItem): number {
  // Primeiro por prioridade (peso maior primeiro)
  const priorityDiff = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
  
  if (priorityDiff !== 0) {
    return priorityDiff;
  }
  
  // Depois por posição na fila
  return a.position - b.position;
}

export function calculateQueueStatistics(items: ProductionQueueItem[]): ProductionQueueStatistics {
  const now = new Date();
  
  const completedItems = items.filter(item => item.status === "completed" && item.completedAt);
  const completionTimes = completedItems.map(item => {
    const completionTime = item.completedAt!;
    const creationTime = item.createdAt;
    return (completionTime.getTime() - creationTime.getTime()) / (1000 * 60 * 60); // horas
  });
  
  const averageCompletionTime = completionTimes.length > 0
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
    : undefined;
  
  // Agrupar por data de conclusão
  const dailyThroughput = completedItems.reduce((acc, item) => {
    if (!item.completedAt) return acc;
    
    const dateStr = item.completedAt.toISOString().split('T')[0];
    const existing = acc.find(d => d.date === dateStr);
    
    if (existing) {
      existing.completed++;
    } else {
      acc.push({ date: dateStr, completed: 1 });
    }
    
    return acc;
  }, [] as Array<{ date: string; completed: number }>);
  
  return {
    totalOrders: items.length,
    pendingOrders: items.filter(item => item.status === "pending").length,
    inProgressOrders: items.filter(item => item.status === "in_progress").length,
    completedOrders: completedItems.length,
    cancelledOrders: items.filter(item => item.status === "cancelled").length,
    averageCompletionTime,
    priorityDistribution: {
      high: items.filter(item => item.priority === "high").length,
      medium: items.filter(item => item.priority === "medium").length,
      low: items.filter(item => item.priority === "low").length,
    },
    dailyThroughput: dailyThroughput.length > 0 ? dailyThroughput : undefined,
  };
}