# DASHBOARD DE PRODUÇÃO EM TEMPO REAL

## 🎯 VISÃO GERAL

Dashboard completo para monitoramento em tempo real da produção, estoque, pedidos e eficiência da fábrica. Atualizações automáticas a cada 30 segundos com WebSocket para notificações instantâneas.

## 🏗️ ARQUITETURA DO DASHBOARD

### Componentes Principais:

```
┌─────────────────────────────────────────────────────────────┐
│                    HEADER: Status Geral                      │
├─────────────┬─────────────┬─────────────┬─────────────┤
│   KPI 1     │   KPI 2     │   KPI 3     │   KPI 4     │
│ Produção    │  Estoque    │   Pedidos   │ Eficiência  │
├─────────────┴─────────────┴─────────────┴─────────────┤
│                                                         │
│          GRÁFICO: Evolução da Produção (24h)           │
│                                                         │
├─────────────┬───────────────────────────┬─────────────┤
│   LISTA:    │        MAPA:              │   ALERTAS:  │
│ Ordens Ativas│   Status Máquinas         │  Críticos   │
│             │                           │             │
└─────────────┴───────────────────────────┴─────────────┘
```

### Tecnologias:
- **Frontend:** React + TypeScript + Tailwind CSS
- **Gráficos:** Recharts ou Chart.js
- **Tempo Real:** WebSocket (Socket.io)
- **Backend:** Fastify (API REST) + WebSocket Server
- **Cache:** Redis para dados em tempo real

## 📊 COMPONENTES DO DASHBOARD

### 1. **Header - Status Geral**
```typescript
interface DashboardHeader {
  lastUpdate: Date;
  systemStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  activeUsers: number;
  refreshInterval: number; // segundos
  autoRefresh: boolean;
}
```

### 2. **KPI Cards (Key Performance Indicators)**
```typescript
interface KPICard {
  title: string;
  value: number | string;
  change: number; // % de mudança
  trend: 'up' | 'down' | 'stable';
  icon: React.ReactNode;
  color: string;
}

const KPIS: KPICard[] = [
  {
    title: 'Produção Hoje',
    value: '1,250',
    change: 12.5,
    trend: 'up',
    icon: '🏭',
    color: 'green'
  },
  {
    title: 'Estoque Crítico',
    value: '8',
    change: -20,
    trend: 'down', 
    icon: '🚨',
    color: 'red'
  },
  {
    title: 'Pedidos Pendentes',
    value: '45',
    change: 5.2,
    trend: 'up',
    icon: '📦',
    color: 'orange'
  },
  {
    title: 'Eficiência',
    value: '87%',
    change: 2.1,
    trend: 'up',
    icon: '📈',
    color: 'blue'
  }
];
```

### 3. **Gráfico - Evolução da Produção (24h)**
```typescript
interface ProductionChartData {
  time: string; // "14:30", "15:00", etc
  produced: number;
  target: number;
  efficiency: number; // %
}

const chartData: ProductionChartData[] = [
  { time: '08:00', produced: 120, target: 150, efficiency: 80 },
  { time: '09:00', produced: 145, target: 150, efficiency: 96.7 },
  { time: '10:00', produced: 138, target: 150, efficiency: 92 },
  // ... dados das últimas 24h
];
```

### 4. **Lista - Ordens de Produção Ativas**
```typescript
interface ActiveOrder {
  id: string;
  orderNumber: string;
  product: string;
  quantity: number;
  produced: number;
  remaining: number;
  status: 'pending' | 'in_progress' | 'paused' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startTime: Date;
  estimatedCompletion: Date;
  machine: string;
  operator: string;
}
```

### 5. **Mapa - Status das Máquinas**
```typescript
interface MachineStatus {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'idle' | 'maintenance' | 'error';
  currentOrder: string | null;
  efficiency: number; // %
  uptime: number; // horas
  lastMaintenance: Date;
  nextMaintenance: Date;
}
```

### 6. **Painel - Alertas Críticos**
```typescript
interface CriticalAlert {
  id: string;
  type: 'stock' | 'production' | 'quality' | 'machine';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: Date;
  acknowledged: boolean;
  assignedTo: string | null;
  resolved: boolean;
}
```

## ⚙️ IMPLEMENTAÇÃO TÉCNICA

### 1. **Componente Principal do Dashboard**
```typescript
const ProductionDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // segundos
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // WebSocket para atualizações em tempo real
  const { isConnected, lastMessage, sendMessage } = useWebSocket(
    process.env.REACT_APP_WS_URL || 'ws://localhost:3333/ws'
  );
  
  // Buscar dados iniciais
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  // Configurar auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchDashboardData();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);
  
  // Processar mensagens WebSocket
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      handleRealtimeUpdate(message);
    }
  }, [lastMessage]);
  
  const fetchDashboardData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/dashboard/data');
      const data = await response.json();
      setDashboardData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    }
  };
  
  const handleRealtimeUpdate = (update: RealtimeUpdate): void => {
    // Atualizar dados em tempo real
    switch (update.type) {
      case 'production_status_change':
        updateProductionStatus(update.data);
        break;
      case 'stock_alert':
        addStockAlert(update.data);
        break;
      case 'new_order':
        addNewOrder(update.data);
        break;
      case 'machine_status_change':
        updateMachineStatus(update.data);
        break;
    }
    
    // Notificar usuário (opcional)
    if (update.priority === 'critical') {
      showNotification(update);
    }
  };
  
  return (
    <div className="dashboard-container">
      {/* Header */}
      <DashboardHeader 
        lastUpdate={lastUpdate}
        systemStatus={isConnected ? 'ONLINE' : 'OFFLINE'}
        refreshInterval={refreshInterval}
        autoRefresh={autoRefresh}
        onRefresh={() => fetchDashboardData()}
        onIntervalChange={setRefreshInterval}
        onAutoRefreshChange={setAutoRefresh}
      />
      
      {/* KPI Cards */}
      <div className="kpi-grid">
        {KPIS.map((kpi, index) => (
          <KPICard key={index} data={kpi} />
        ))}
      </div>
      
      {/* Gráfico Principal */}
      <ProductionChart data={dashboardData?.chartData || []} />
      
      {/* Grid Inferior */}
      <div className="bottom-grid">
        <ActiveOrdersList orders={dashboardData?.activeOrders || []} />
        <MachineStatusMap machines={dashboardData?.machines || []} />
        <CriticalAlertsPanel alerts={dashboardData?.alerts || []} />
      </div>
    </div>
  );
};
```

### 2. **API Backend para Dashboard**
```typescript
// routes/dashboard.routes.ts
export const dashboardRoutes = async (fastify: FastifyInstance) => {
  // Dados completos do dashboard
  fastify.get('/data', async (request, reply) => {
    try {
      const data = await dashboardService.getDashboardData();
      return reply.send(data);
    } catch (error) {
      return reply.status(500).send({ error: 'Erro ao buscar dados do dashboard' });
    }
  });
  
  // Dados específicos (para otimização)
  fastify.get('/kpis', async (request, reply) => {
    const kpis = await dashboardService.getKPIs();
    return reply.send(kpis);
  });
  
  fastify.get('/active-orders', async (request, reply) => {
    const orders = await dashboardService.getActiveOrders();
    return reply.send(orders);
  });
  
  fastify.get('/stock-alerts', async (request, reply) => {
    const alerts = await dashboardService.getStockAlerts();
    return reply.send(alerts);
  });
  
  // WebSocket para atualizações em tempo real
  fastify.get('/ws', { websocket: true }, (connection, req) => {
    console.log('Cliente WebSocket conectado');
    
    // Enviar dados iniciais
    connection.socket.send(JSON.stringify({
      type: 'initial_data',
      data: { message: 'Conectado ao dashboard em tempo real' }
    }));
    
    // Escutar mensagens do cliente
    connection.socket.on('message', (message) => {
      console.log('Mensagem do cliente:', message);
    });
    
    // Configurar heartbeat
    const heartbeat = setInterval(() => {
      connection.socket.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
    }, 30000); // 30 segundos
    
    // Limpar ao desconectar
    connection.socket.on('close', () => {
      clearInterval(heartbeat);
      console.log('Cliente WebSocket desconectado');
    });
  });
};

// services/dashboard.service.ts
export class DashboardService {
  private cache: RedisCache;
  private database: PrismaClient;
  
  async getDashboardData(): Promise<DashboardData> {
    // Tentar cache primeiro
    const cached = await this.cache.get('dashboard:data');
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Buscar dados de várias fontes em paralelo
    const [kpis, activeOrders, stockAlerts, machines, chartData] = await Promise.all([
      this.getKPIs(),
      this.getActiveOrders(),
      this.getStockAlerts(),
      this.getMachineStatus(),
      this.getProductionChartData()
    ]);
    
    const dashboardData: DashboardData = {
      kpis,
      activeOrders,
      stockAlerts,
      machines,
      chartData,
      lastUpdate: new Date()
    };
    
    // Cache por 30 segundos
    await this.cache.set('dashboard:data', JSON.stringify(dashboardData), 30);
    
    return dashboardData;
  }
  
  async getKPIs(): Promise<KPICard[]> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Produção hoje
    const productionToday = await this.database.productionOrder.aggregate({
      where: {
        status: 'completed',
        completedAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      },
      _sum: { quantityProduced: true }
    });
    
    // Produção ontem
    const productionYesterday = await this.database.productionOrder.aggregate({
      where: {
        status: 'completed',
        completedAt: {
          gte: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate())
        }
      },
      _sum: { quantityProduced: true }
    });
    
    // Estoque crítico
    const criticalStock = await this.database.stockAlert.count({
      where: { priority: 'critical', resolved: false }
    });
    
    // Pedidos pendentes
    const pendingOrders = await this.database.salesOrder.count({
      where: { status: 'pending' }
    });
    
    // Eficiência média
    const efficiency = await this.calculateAverageEfficiency();
    
    return [
      {
        title: 'Produção Hoje',
        value: productionToday._sum.quantityProduced?.toLocaleString() || '0',
        change: this.calculateChange(
          productionYesterday._sum.quantityProduced || 0,
          productionToday._sum.quantityProduced || 0
        ),
        trend: productionToday._sum.quantityProduced! >= productionYesterday._sum.quantityProduced! ? 'up' : 'down',
        icon: '🏭',
        color: 'green'
      },
      {
        title: 'Estoque Crítico',
        value: criticalStock.toString(),
        change: -10, // Exemplo
        trend: 'down',
        icon: '🚨',
        color: 'red'
      },
      {
        title: 'Pedidos Pendentes',
        value: pendingOrders.toString(),
        change: 5.2,
        trend: 'up',
        icon: '📦',
        color: 'orange'
      },
      {
        title: 'Eficiência',
        value: `${efficiency.toFixed(1)}%`,
        change: 2.1,
        trend: 'up',
        icon: '📈',
        color: 'blue'
      }
    ];
  }
  
  async getActiveOrders(): Promise<ActiveOrder[]> {
    return await this.database.productionOrder.findMany({
      where: {
        status: { in: ['pending', 'in_progress', 'paused'] }
      },
      include: {
        product: true,
        machine: true,
        operator: true
      },
      orderBy: { priority: 'desc' },
      take: 10
    });
  }
  
  async getStockAlerts(): Promise<CriticalAlert[]> {
    return await this.database.stockAlert.findMany({
      where: {
        resolved: false,
        priority: { in: ['high', 'critical'] }
      },
      orderBy: { priority: 'desc' },
      take: 5
    });
  }
}
```

### 3. **Sistema WebSocket para Tempo Real**
```typescript
// websocket/dashboard.websocket.ts
export class DashboardWebSocketServer {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();
  
  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server, path: '/ws/dashboard' });
    this.setupWebSocket();
  }
  
  private setupWebSocket(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Novo cliente WebSocket conectado');
      this.clients.add(ws);
      
      // Enviar dados iniciais
      this.sendInitialData(ws);
      
      // Configurar heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
        }
      }, 30000);
      
      // Escutar mensagens
      ws.on('message', (message: string) => {
        this.handleClientMessage(ws, message);
      });
      
      // Limpar ao desconectar
      ws.on('close', () => {
        clearInterval(heartbeat);
        this.clients.delete(ws);
        console.log('Cliente WebSocket desconectado');
      });
      
      // Tratar erros
      ws.on('error', (error) => {
        console.error('Erro WebSocket:', error);
        this.clients.delete(ws);
      });
    });
  }
  
  private sendInitialData(ws: WebSocket): void {
    const initialData = {
      type: 'initial_data',
      data: {
        message: 'Conectado ao dashboard de produção',
        serverTime: new Date().toISOString(),
        version: '1.0.0'
      }
    };
    
    ws.send(JSON.stringify(initialData));
  }
  
  private handleClientMessage(ws: WebSocket, message: string): void {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(ws, data.channel);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, data.channel);
          break;
        case 'command':
          this.handleCommand(ws, data.command);
          break;
      }
    } catch (error) {
      console.error('Erro ao processar mensagem do cliente:', error);
    }
  }
  
  // Broadcast para todos os clientes
  public broadcast(event: string, data: any): void {
    const message = JSON.stringify({ type: event, data, timestamp: Date.now() });
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Enviar para cliente específico
  public sendToClient(clientId: string, event: string, data: any): void {
    // Implementar lógica para enviar para cliente específico
  }
}

// Integração com serviços existentes
export class RealtimeUpdateService {
  private wsServer: DashboardWebSocketServer;
  
  constructor(wsServer: DashboardWebSocketServer) {
    this.wsServer = wsServer;
    
    // Configurar listeners para eventos em tempo real
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    // Listener para mudanças no estoque
    stockMonitorService.on('stock_alert', (alert: StockAlert) => {
      this.wsServer.broadcast('stock_alert', alert);
    });
    
    // Listener para mudanças na produção
    productionService.on('order_status_change', (change: OrderStatusChange) => {
      this.wsServer.broadcast('order_status_change', change);
    });
    
    // Listener para novas ordens
    salesService.on('new_order', (order: SalesOrder) => {
      this.wsServer.broadcast('new_order', order);
    });
    
    // Listener para status das máquinas
    machineService.on('machine_status_change', (status: MachineStatus) => {
      this.wsServer.broadcast('machine_status_change', status);
    });
  }
}
```

### 4. **Componentes React Específicos**
```typescript
// components/KPICard.tsx
interface KPICardProps {
  data: KPICard;
}

export const KPICard: React.FC<KPICardProps> = ({ data }) => {
  const { title, value, change, trend, icon, color } = data;
  
  const trendColor = trend === 'up' ? 'text-green-600' : 
                    trend === 'down' ? 'text-red-600' : 
                    'text-gray-600';
  
  const trendIcon = trend === 'up' ? '↗' : 
                   trend === 'down' ? '↘' : 
                   '→';
  
  return (
    <div className={`kpi-card bg-white rounded-lg shadow-md p-6 border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl">{icon}</div>
        <div className={`text-sm font-semibold ${trendColor}`}>
          {trendIcon} {Math.abs(change)}%
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-3xl font-bold text-gray-800">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
      </div>
      
      <div className="text-xs text-gray-500 mt-4">
        Atualizado há poucos segundos
      </div>
    </div>
  );
};

// components/ProductionChart.tsx
export const ProductionChart: React.FC<{ data: ProductionChartData[] }> = ({ data }) => {
  return (
    <div className="production-chart bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Evolução da Produção (24h)</h3>
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
            Hoje
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
            Semana
          </button>
          <button className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200">
            Mês
          </button>
        </div>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="time" 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#666"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              formatter={(value) => [value, 'Unidades']}
              labelFormatter={(label) => `Hora: ${label}`}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="produced" 
              name="Produzido"
              stroke="#3b82f6" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="target" 
              name="Meta"
              stroke="#10b981" 
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// components/ActiveOrdersList.tsx
export const ActiveOrdersList: React.FC<{ orders: ActiveOrder[] }> = ({ orders }) => {
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'border-red-500';
      case 'high': return 'border-orange-500';
      case 'medium': return 'border-yellow-500';
      case 'low': return 'border-gray-500';
      default: return 'border-gray-300';
    }
  };
  
  return (
    <div className="active-orders bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ordens de Produção Ativas</h3>
      
      <div className="space-y-4">
        {orders.map((order) => (
          <div 
            key={order.id}
            className={`order-item p-4 rounded-lg border-l-4 ${getPriorityColor(order.priority)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium text-gray-900">{order.orderNumber}</div>
              <div className={`px-2 py-1 text-xs rounded-full ${getStatusColor(order.status)}`}>
                {order.status === 'in_progress' ? 'Em Andamento' : 
                 order.status === 'pending' ? 'Pendente' :
                 order.status === 'paused' ? 'Pausada' : 'Concluída'}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-2">
              {order.product} • {order.quantity} unidades
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-700">
                <span className="font-medium">{order.produced}</span> produzidas
                <span className="mx-2">•</span>
                <span className="font-medium">{order.remaining}</span> restantes
              </div>
              
              <div className="text-gray-500">
                {order.machine} • {order.operator}
              </div>
            </div>
            
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(order.produced / order.quantity) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Início: {format(order.startTime, 'HH:mm')}</span>
                <span>Previsão: {format(order.estimatedCompletion, 'HH:mm')}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 🎨 DESIGN RESPONSIVO

### Breakpoints:
```css
/* Tailwind CSS */
.sm: min-width: 640px
.md: min-width: 768px  
.lg: min-width: 1024px
.xl: min-width: 1280px
.2xl: min-width: 1536px
```

### Layout Responsivo:
```
Mobile (sm):
┌─────────────────┐
│     HEADER      │
├─────────────────┤
│     KPI 1       │
├─────────────────┤
│     KPI 2       │
├─────────────────┤
│     KPI 3       │
├─────────────────┤
│     KPI 4       │
├─────────────────┤
│     CHART       │
├─────────────────┤
│     ORDERS      │
├─────────────────┤
│     MACHINES    │
├─────────────────┤
│     ALERTS      │
└─────────────────┘

Desktop (lg):
┌─────────────────────────────────────────┐
│               HEADER                    │
├─────────┬─────────┬─────────┬─────────┤
│  KPI 1  │  KPI 2  │  KPI 3  │  KPI 4  │
├─────────────────────────────────────────┤
│               CHART                     │
├─────────┬─────────────────┬─────────┤
│ ORDERS  │   MACHINES      │ ALERTS  │
└─────────┴─────────────────┴─────────┘
```

## 🔧 CONFIGURAÇÃO

### Variáveis de Ambiente:
```env
REACT_APP_API_URL=http://localhost:3333
REACT_APP_WS_URL=ws://localhost:3333/ws
REACT_APP_REFRESH_INTERVAL=30
REACT_APP_VERSION=1.0.0
```

### Dependências:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.8.2",
    "socket.io-client": "^4.7.2",
    "tailwindcss": "^3.3.0",
    "date-fns": "^2.30.0",
    "axios": "^1.4.0"
  }
}
```

## 🚀 PLANO DE IMPLEMENTAÇÃO

### FASE 1 (Dias 1-2): Estrutura Básica
- [ ] Configurar projeto React + TypeScript
- [ ] Configurar Tailwind CSS
- [ ] Criar componentes base (Header, KPI Cards)
- [ ] Configurar API básica no backend

### FASE 2 (Dias 3-4): Dados em Tempo Real
- [ ] Implementar WebSocket server
- [ ] Conectar frontend ao WebSocket
- [ ] Criar gráfico de produção
- [ ] Implementar atualização automática

### FASE 3 (Dias 5-7): Componentes Avançados
- [ ] Criar lista de ordens ativas
- [ ] Implementar mapa de status das máquinas
- [ ] Criar painel de alertas críticos
- [ ] Adicionar responsividade

### FASE 4 (Dias 8-10): Otimização
- [ ] Implementar cache no frontend
- [ ] Adicionar loading states
- [ ] Otimizar performance
- [ ] Testes e validação

## 📈 MÉTRICAS DE PERFORMANCE

### Frontend:
- **Tempo de carregamento inicial:** < 2s
- **Tempo de atualização:** < 500ms
- **Uso de memória:** < 100MB
- **FPS:** > 60fps

### Backend:
- **Latência da API:** < 100ms
- **Tempo de resposta WebSocket:** < 50ms
- **Concurrent connections:** > 1000
- **Uptime:** > 99.9%

---

**PRÓXIMOS PASSOS IMEDIATOS:**
1. Criar estrutura do projeto React
2. Configurar WebSocket server no Fastify
3. Implementar componente Header com status
4. Criar KPI Cards com dados mockados
5. Conectar ao backend real

**OBJETIVO:** Ter dashboard mínimo funcionando em **72 horas** com atualizações em tempo real.