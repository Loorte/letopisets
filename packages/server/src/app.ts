import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { worldRoutes } from "./routes/worlds.js";
import { fmgRoutes } from "./routes/fmg.js";
import { entityRoutes } from "./routes/entities.js";
import { translateRoutes } from "./routes/translate.js";
import { dbPlugin } from "./plugins/db.js";
import { redisPlugin } from "./plugins/redis.js";
import { wsHandler } from "./ws/handler.js";

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: "info",
    },
    bodyLimit: 50 * 1024 * 1024, // 50MB for FMG JSON imports
  });

  await app.register(cors, { origin: config.cors.origin });
  await app.register(websocket);

  await app.register(dbPlugin);
  await app.register(redisPlugin);

  await app.register(healthRoutes);
  await app.register(worldRoutes);
  await app.register(fmgRoutes);
  await app.register(entityRoutes);
  await app.register(translateRoutes);
  await app.register(wsHandler);

  return app;
}
