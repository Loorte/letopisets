import type { FastifyInstance } from "fastify";
import { worlds } from "../db/schema.js";
import { createWorldSchema } from "@letopisets/shared/schemas/world";
import { desc, eq } from "drizzle-orm";

export async function worldRoutes(app: FastifyInstance) {
  app.get("/worlds", async () => {
    const rows = await app.db
      .select()
      .from(worlds)
      .orderBy(desc(worlds.createdAt));
    return rows;
  });

  app.get<{ Params: { id: string } }>("/worlds/:id", async (request, reply) => {
    const [world] = await app.db
      .select()
      .from(worlds)
      .where(eq(worlds.id, request.params.id));

    if (!world) {
      return reply.status(404).send({ error: "Мир не найден" });
    }
    return world;
  });

  app.post("/worlds", async (request, reply) => {
    const parsed = createWorldSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const [created] = await app.db
      .insert(worlds)
      .values(parsed.data)
      .returning();

    return reply.status(201).send(created);
  });

  app.delete<{ Params: { id: string } }>("/worlds/:id", async (request, reply) => {
    const [deleted] = await app.db
      .delete(worlds)
      .where(eq(worlds.id, request.params.id))
      .returning();

    if (!deleted) {
      return reply.status(404).send({ error: "Мир не найден" });
    }
    return reply.status(200).send({ ok: true });
  });
}
