/**
 * Factory para obter o tipo de gateway de forma isolada
 * 
 * Esta função tenta usar o env.ts como fonte única, mas tem fallback seguro
 * para quando o env não está disponível (durante testes).
 */
export async function getGatewayType(): Promise<"fake" | "real"> {
  try {
    // Tenta importar dinamicamente o env.ts como fonte única
    const { env } = await import("../../../../config");
    return env.PRODUCTION_ORDER_GATEWAY;
  } catch (error) {
    // Fallback seguro para quando env não está disponível
    // (durante testes ou quando config não foi carregada)
    const gatewayType = process.env.PRODUCTION_ORDER_GATEWAY;
    
    if (gatewayType === "real") {
      return "real";
    }
    
    // Default seguro para "fake"
    return "fake";
  }
}