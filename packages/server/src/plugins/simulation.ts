import fp from "fastify-plugin";
import type { WsMessage } from "@letopisets/shared/schemas/simulation";
import { SimulationEngine } from "../simulation/index.js";
import { broadcastToWorld } from "../ws/handler.js";

declare module "fastify" {
  interface FastifyInstance {
    simulation: SimulationEngine;
  }
}

export const simulationPlugin = fp(async (app) => {
  const engine = new SimulationEngine(app.db, app.redis, {
    onTickStart(worldId, tick) {
      const msg: WsMessage = { type: "tick:start", worldId, tick };
      broadcastToWorld(worldId, msg);
    },
    onEventCreated(worldId, event) {
      const msg: WsMessage = {
        type: "event:created",
        worldId,
        event: {
          id: event.id,
          tick: event.tick,
          type: event.type as WsMessage extends { type: "event:created" } ? WsMessage["event"]["type"] : never,
          title: event.title,
          description: event.description,
          severity: event.severity as "minor" | "moderate" | "major" | "catastrophic",
          relatedEntityIds: event.relatedEntityIds,
        },
      };
      broadcastToWorld(worldId, msg);
    },
    onTickComplete(worldId, result) {
      const msg: WsMessage = { type: "tick:complete", worldId, result };
      broadcastToWorld(worldId, msg);
    },
    onSimStatus(worldId, status, speed) {
      const msg: WsMessage = {
        type: "sim:status",
        worldId,
        status: status as "idle" | "running" | "paused",
        speed,
      };
      broadcastToWorld(worldId, msg);
    },
  });

  app.decorate("simulation", engine);

  app.addHook("onClose", async () => {
    await engine.close();
  });
});
