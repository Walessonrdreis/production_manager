type LoggerLike = {
  info: (msg: string, obj?: any) => void;
  warn: (msg: string, obj?: any) => void;
  error: (msg: string, obj?: any) => void;
  debug?: (msg: string, obj?: any) => void;
  child?: (context: Record<string, any>) => LoggerLike;
};

export type Logger = LoggerLike;

let baseLogger: LoggerLike | null = null;

/**
 * Inicializa o logger base (normalmente com app.log do Fastify)
 * Deve ser chamado no bootstrap.
 */
export function setBaseLogger(logger: LoggerLike) {
  baseLogger = logger;
}

/**
 * Retorna um logger seguro.
 * - Se Fastify estiver disponível, usa ele
 * - Caso contrário, fallback para console
 */
export function getLogger(context?: string): LoggerLike {
  if (baseLogger) {
    if (context && typeof (baseLogger as any).child === "function") {
      return (baseLogger as any).child({ context });
    }
    return baseLogger;
  }

  // fallback (scripts / testes / early bootstrap)
  return {
    info: (msg, obj) => console.log(msg, obj ?? ""),
    warn: (msg, obj) => console.warn(msg, obj ?? ""),
    error: (msg, obj) => console.error(msg, obj ?? ""),
    debug: (msg, obj) => console.debug(msg, obj ?? ""),
  };
}