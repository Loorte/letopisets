import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { dbPlugin } from "./plugins/db.js";
import { redisPlugin } from "./plugins/redis.js";
import { wsHandler } from "./ws/handler.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
    },
  });

  await app.register(cors, { origin: config.cors.origin });
  await app.register(websocket);

  await app.register(dbPlugin);
  await app.register(redisPlugin);

  await app.register(healthRoutes);
  await app.register(wsHandler);

  return app;
}
