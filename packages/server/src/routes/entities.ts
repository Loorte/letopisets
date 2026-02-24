import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { states, burgs, cultures, religions } from "../db/schema.js";

export async function entityRoutes(app: FastifyInstance) {
  // States
  app.get<{ Params: { id: string } }>("/worlds/:id/states", async (request) => {
    return app.db.select().from(states).where(eq(states.worldId, request.params.id));
  });

  // Burgs
  app.get<{ Params: { id: string } }>("/worlds/:id/burgs", async (request) => {
    return app.db.select().from(burgs).where(eq(burgs.worldId, request.params.id));
  });

  // Cultures
  app.get<{ Params: { id: string } }>("/worlds/:id/cultures", async (request) => {
    return app.db.select().from(cultures).where(eq(cultures.worldId, request.params.id));
  });

  // Religions
  app.get<{ Params: { id: string } }>("/worlds/:id/religions", async (request) => {
    return app.db.select().from(religions).where(eq(religions.worldId, request.params.id));
  });
}
