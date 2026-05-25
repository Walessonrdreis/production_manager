import "fastify";

import type { PrismaClient } from "@prisma/client";
import type { OmieHttpClientPort } from "@/shared/integrations/omie/omie-http-client.port";


declare module "fastify" {
  interface FastifySchema {
    description?: string;
    summary?: string;
    tags?: string[];
  prisma: PrismaClient;
    omieClient: OmieHttpClientPort;

  }
}