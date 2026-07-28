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
export function setBaseLogger(logger: any) {
  baseLogger = {
    info: (msg: string, obj?: any) => {
      if (obj) {
        logger.info(obj, msg);
      } else {
        logger.info(msg);
      }
    },
    warn: (msg: string, obj?: any) => {
      if (obj) {
        logger.warn(obj, msg);
      } else {
        logger.warn(msg);
      }
    },
    error: (msg: string, obj?: any) => {
      if (obj) {
        logger.error(obj, msg);
      } else {
        logger.error(msg);
      }
    },
    debug: (msg: string, obj?: any) => {
      if (obj) {
        logger.debug?.(obj, msg);
      } else {
        logger.debug?.(msg);
      }
    },
    child: (context: Record<string, any>) => {
      if (typeof logger.child === "function") {
        const childLogger = logger.child(context);

        return {
          info: (msg: string, obj?: any) => {
            if (obj) {
              childLogger.info(obj, msg);
            } else {
              childLogger.info(msg);
            }
          },
          warn: (msg: string, obj?: any) => {
            if (obj) {
              childLogger.warn(obj, msg);
            } else {
              childLogger.warn(msg);
            }
          },
          error: (msg: string, obj?: any) => {
            if (obj) {
              childLogger.error(obj, msg);
            } else {
              childLogger.error(msg);
            }
          },
          debug: (msg: string, obj?: any) => {
            if (obj) {
              childLogger.debug?.(obj, msg);
            } else {
              childLogger.debug?.(msg);
            }
          },
        };
      }

      return baseLogger as LoggerLike;
    },
  };
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