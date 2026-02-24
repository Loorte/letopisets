import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export async function settingsRoutes(app: FastifyInstance) {
  app.get("/settings/anthropic-status", async () => {
    return { configured: !!config.anthropic.apiKey };
  });
}
