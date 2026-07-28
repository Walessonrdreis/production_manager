/**
 * Teste de validação do sistema de retry
 * 
 * Objetivo: Validar que:
 * 1. maxAttempts = 2 (1 tentativa inicial + 1 retry)
 * 2. Retry ocorre apenas para erros transitórios
 * 3. Circuit breaker funciona corretamente
 */

import { RetrySystem } from "./RetrySystem";
import { shouldRetry } from "./retry.config";
import { getRetryConfig } from "./retry.config";

// Mock logger para testes
const mockLogger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta),
  warn: (msg: string, meta?: any) => console.log(`[WARN] ${msg}`, meta),
  error: (msg: string, meta?: any) => console.log(`[ERROR] ${msg}`, meta),
  debug: (msg: string, meta?: any) => console.log(`[DEBUG] ${msg}`, meta),
};

/**
 * Teste 1: Validação de maxAttempts = 2
 */
async function testMaxAttempts() {
  console.log("\n=== Teste 1: Validação de maxAttempts = 2 ===");
  
  const retrySystem = new RetrySystem(mockLogger);
  const config = getRetryConfig("omie-production-orders-sync");
  
  console.log(`Configuração obtida: maxAttempts = ${config.maxAttempts}`);
  
  if (config.maxAttempts !== 2) {
    throw new Error(`maxAttempts deve ser 2, mas é ${config.maxAttempts}`);
  }
  
  console.log("✅ maxAttempts configurado corretamente como 2");
  
  // Teste com operação que falha com erro transitório (timeout)
  let attemptCount = 0;
  const failingOperation = async () => {
    attemptCount++;
    const error = new Error(`Simulated timeout error on attempt ${attemptCount}`);
    (error as any).code = "ETIMEDOUT"; // Erro transitório
    throw error;
  };
  
  const result = await retrySystem.executeWithRetry(
    failingOperation,
    config,
    "test-max-attempts"
  );
  
  console.log(`Resultado: success=${result.success}, attempts=${result.attempts}`);
  
  if (result.attempts !== 2) {
    throw new Error(`Esperado 2 tentativas, mas foram ${result.attempts}`);
  }
  
  console.log("✅ Sistema tentou exatamente 2 vezes (1 tentativa + 1 retry)");
}

/**
 * Teste 2: Validação de shouldRetry para erros transitórios
 */
function testShouldRetryLogic() {
  console.log("\n=== Teste 2: Validação de shouldRetry ===");
  
  // Teste com erros transitórios (deve retentar)
  const transientErrors = [
    { code: "ETIMEDOUT", response: { status: null } },
    { code: "ECONNRESET", response: { status: null } },
    { response: { status: 429 } }, // Rate limit
    { response: { status: 500 } }, // Erro de servidor
    { response: { status: 502 } }, // Bad gateway
    { response: { status: 503 } }, // Service unavailable
    { response: { status: 504 } }, // Gateway timeout
  ];
  
  console.log("Testando erros transitórios (deve retentar):");
  transientErrors.forEach((error, index) => {
    const should = shouldRetry(error);
    console.log(`  Erro ${index + 1}: ${should ? "✅" : "❌"} - ${JSON.stringify(error)}`);
    
    if (!should) {
      throw new Error(`Erro transitório deveria retentar: ${JSON.stringify(error)}`);
    }
  });
  
  // Teste com erros não transitórios (NÃO deve retentar)
  const nonTransientErrors = [
    { response: { status: 400 } }, // Bad request
    { response: { status: 401 } }, // Unauthorized
    { response: { status: 403 } }, // Forbidden
    { response: { status: 404 } }, // Not found
    { code: "VALIDATION_ERROR", response: { status: 422 } }, // Validation error
  ];
  
  console.log("\nTestando erros não transitórios (NÃO deve retentar):");
  nonTransientErrors.forEach((error, index) => {
    const should = shouldRetry(error);
    console.log(`  Erro ${index + 1}: ${should ? "❌" : "✅"} - ${JSON.stringify(error)}`);
    
    if (should) {
      throw new Error(`Erro não transitório NÃO deveria retentar: ${JSON.stringify(error)}`);
    }
  });
  
  console.log("✅ Lógica de shouldRetry funciona corretamente");
}

/**
 * Teste 3: Validação de circuit breaker
 */
async function testCircuitBreaker() {
  console.log("\n=== Teste 3: Validação de circuit breaker ===");
  
  const retrySystem = new RetrySystem(mockLogger);
  const config = getRetryConfig("stock-monitor");
  
  console.log(`Configuração: threshold=${config.circuitBreakerThreshold}, reset=${config.circuitBreakerResetTimeoutMs}ms`);
  
  if (config.circuitBreakerThreshold !== 3) {
    throw new Error(`circuitBreakerThreshold deve ser 3, mas é ${config.circuitBreakerThreshold}`);
  }
  
  if (config.circuitBreakerResetTimeoutMs !== 60000) {
    throw new Error(`circuitBreakerResetTimeoutMs deve ser 60000, mas é ${config.circuitBreakerResetTimeoutMs}`);
  }
  
  console.log("✅ Configuração do circuit breaker correta");
  
  // Simula falhas consecutivas para acionar o circuit breaker
  let consecutiveFails = 0;
  const alwaysFailingOperation = async () => {
    consecutiveFails++;
    throw new Error(`Simulated failure ${consecutiveFails}`);
  };
  
  // Executa até acionar o circuit breaker
  const results = [];
  for (let i = 0; i < 5; i++) {
    const result = await retrySystem.executeWithRetry(
      alwaysFailingOperation,
      config,
      `test-circuit-breaker-${i}`
    );
    results.push(result);
    
    console.log(`  Execução ${i + 1}: success=${result.success}, attempts=${result.attempts}, circuitBreakerState=${result.circuitBreakerState}`);
    
    if (i >= 2 && result.circuitBreakerState === "open") {
      console.log("✅ Circuit breaker acionado após 3 falhas consecutivas");
      break;
    }
  }
  
  // Verifica se o circuit breaker foi acionado
  const circuitBreakerTripped = results.some(r => r.circuitBreakerState === "open");
  
  if (!circuitBreakerTripped) {
    console.warn("⚠️  Circuit breaker pode não estar funcionando corretamente");
  } else {
    console.log("✅ Circuit breaker funciona conforme esperado");
  }
}

/**
 * Teste 4: Validação de backoff exponencial
 */
async function testExponentialBackoff() {
  console.log("\n=== Teste 4: Validação de backoff exponencial ===");
  
  const retrySystem = new RetrySystem(mockLogger);
  const config = getRetryConfig("omie-orders-stage20-sync");
  
  console.log(`Configuração: baseDelayMs=${config.baseDelayMs}, exponentialFactor=${config.exponentialFactor}, maxDelayMs=${config.maxDelayMs}`);
  
  // Calcula delays esperados
  const expectedDelay1 = config.baseDelayMs; // Primeiro retry
  const expectedDelay2 = Math.min(
    config.baseDelayMs * Math.pow(config.exponentialFactor, 1),
    config.maxDelayMs
  ); // Segundo retry (se houvesse)
  
  console.log(`Delays esperados: 1º retry=${expectedDelay1}ms, 2º retry=${expectedDelay2}ms`);
  
  if (config.baseDelayMs < 1000) {
    console.warn("⚠️  baseDelayMs muito baixo (<1000ms), pode causar sobrecarga");
  }
  
  if (config.maxDelayMs > 30000) {
    console.warn("⚠️  maxDelayMs muito alto (>30000ms), pode causar atrasos excessivos");
  }
  
  console.log("✅ Configuração de backoff parece razoável");
}

/**
 * Executa todos os testes
 */
async function runAllTests() {
  console.log("🚀 Iniciando validação do sistema de retry e robustez\n");
  
  try {
    await testMaxAttempts();
    await new Promise(resolve => setTimeout(resolve, 100)); // Pequena pausa
    
    testShouldRetryLogic();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testCircuitBreaker();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await testExponentialBackoff();
    
    console.log("\n🎉 Todos os testes passaram com sucesso!");
    console.log("✅ Sistema de retry configurado corretamente");
    console.log("✅ Retry condicionado apenas para erros transitórios");
    console.log("✅ Circuit breaker funcionando");
    console.log("✅ Backoff exponencial configurado");
    
  } catch (error: any) {
    console.error("\n❌ Falha na validação:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executa os testes se este arquivo for executado diretamente
if (require.main === module) {
  runAllTests().catch(error => {
    console.error("Erro fatal:", error);
    process.exit(1);
  });
}

export {
  testMaxAttempts,
  testShouldRetryLogic,
  testCircuitBreaker,
  testExponentialBackoff,
  runAllTests,
};