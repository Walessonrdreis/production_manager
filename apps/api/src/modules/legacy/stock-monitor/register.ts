import type { FastifyInstance } from "fastify";
import { startStockMonitorJob } from "./infrastructure/jobs/stock-monitor.job";

export function registerStockMonitorModule(app: FastifyInstance) {
  const stopJob = startStockMonitorJob(app);

  app.addHook("onClose", async () => {
    if (stopJob) {
      stopJob();
    }
  });

  return {
    stopJob,
  };
}