type LoggerLike = {
  info: (obj: any, msg?: string) => void;
  warn: (obj: any, msg?: string) => void;
  error: (obj: any, msg?: string) => void;
  debug?: (obj: any, msg?: string) => void;
};

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
    info: (obj, msg) => console.log(msg ?? "", obj),
    warn: (obj, msg) => console.warn(msg ?? "", obj),
    error: (obj, msg) => console.error(msg ?? "", obj),
    debug: (obj, msg) => console.debug(msg ?? "", obj),
  };
}