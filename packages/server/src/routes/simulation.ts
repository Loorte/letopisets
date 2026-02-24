import type { FastifyInstance } from "fastify";
import { eq, desc, and } from "drizzle-orm";
import { simSpeedEnum } from "@letopisets/shared/schemas/simulation";
import * as schema from "../db/schema.js";

export async function simulationRoutes(app: FastifyInstance) {
  // Start simulation
  app.post<{
    Params: { id: string };
    Body: { speed?: string };
  }>("/worlds/:id/simulation/start", async (request, reply) => {
    const { id } = request.params;
    const speed = simSpeedEnum.catch("normal").parse(request.body?.speed ?? "normal");

    await app.simulation.start(id, speed);
    return reply.send({ ok: true, speed });
  });

  // Pause simulation
  app.post<{ Params: { id: string } }>(
    "/worlds/:id/simulation/pause",
    async (request, reply) => {
      const { id } = request.params;
      await app.simulation.pause(id);
      return reply.send({ ok: true });
    },
  );

  // Single step
  app.post<{ Params: { id: string } }>(
    "/worlds/:id/simulation/step",
    async (request, reply) => {
      const { id } = request.params;
      await app.simulation.step(id);
      return reply.send({ ok: true });
    },
  );

  // Stop simulation
  app.post<{ Params: { id: string } }>(
    "/worlds/:id/simulation/stop",
    async (request, reply) => {
      const { id } = request.params;
      await app.simulation.stop(id);
      return reply.send({ ok: true });
    },
  );

  // Get simulation status
  app.get<{ Params: { id: string } }>(
    "/worlds/:id/simulation/status",
    async (request, reply) => {
      const { id } = request.params;
      const status = await app.simulation.getStatus(id);
      return reply.send(status);
    },
  );

  // Get world events (timeline)
  app.get<{
    Params: { id: string };
    Querystring: { limit?: string; offset?: string; type?: string };
  }>("/worlds/:id/events", async (request, reply) => {
    const { id } = request.params;
    const limit = Math.min(Number(request.query.limit) || 50, 200);
    const offset = Number(request.query.offset) || 0;
    const typeFilter = request.query.type;

    const conditions = [eq(schema.worldEvents.worldId, id)];

    if (typeFilter && ["political", "economic", "military", "social", "natural", "magical", "creature"].includes(typeFilter)) {
      conditions.push(
        eq(schema.worldEvents.type, typeFilter as "political" | "economic" | "military" | "social" | "natural" | "magical" | "creature"),
      );
    }

    const events = await app.db
      .select()
      .from(schema.worldEvents)
      .where(and(...conditions))
      .orderBy(desc(schema.worldEvents.tick), desc(schema.worldEvents.createdAt))
      .limit(limit)
      .offset(offset);

    return reply.send(events);
  });
}
