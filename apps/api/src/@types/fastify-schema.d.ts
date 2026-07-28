import "fastify";

import type { PrismaClient } from "@prisma/client";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient;
    omieClient: OmieHttpClientPort;
  }

  interface FastifySchema {
    description?: string;
    summary?: string;
    tags?: string[];
    hide?: boolean;
  }
}