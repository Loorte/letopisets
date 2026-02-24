import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { worlds, states, burgs, cultures, religions } from "../db/schema.js";
import { parseFmgData } from "../services/fmg-parser.js";
import type { FmgMapData } from "@letopisets/shared/types/fmg";

export async function fmgRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    "/worlds/:id/fmg/import",
    async (request, reply) => {
      const worldId = request.params.id;

      // Verify world exists
      const [world] = await app.db
        .select()
        .from(worlds)
        .where(eq(worlds.id, worldId));

      if (!world) {
        return reply.status(404).send({ error: "Мир не найден" });
      }

      const fmgData = request.body as FmgMapData;
      if (!fmgData || !fmgData.states || !fmgData.burgs) {
        return reply.status(400).send({ error: "Некорректный формат FMG JSON" });
      }

      const parsed = parseFmgData(fmgData);

      // Delete existing entities for this world before re-import
      await app.db.delete(burgs).where(eq(burgs.worldId, worldId));
      await app.db.delete(states).where(eq(states.worldId, worldId));
      await app.db.delete(cultures).where(eq(cultures.worldId, worldId));
      await app.db.delete(religions).where(eq(religions.worldId, worldId));

      // Insert cultures
      let insertedCultures: { id: string; fmgId: number }[] = [];
      if (parsed.cultures.length > 0) {
        insertedCultures = await app.db
          .insert(cultures)
          .values(parsed.cultures.map((c) => ({ ...c, worldId })))
          .returning({ id: cultures.id, fmgId: cultures.fmgId });
      }

      // Insert religions
      let insertedReligions: { id: string; fmgId: number }[] = [];
      if (parsed.religions.length > 0) {
        insertedReligions = await app.db
          .insert(religions)
          .values(parsed.religions.map((r) => ({ ...r, worldId })))
          .returning({ id: religions.id, fmgId: religions.fmgId });
      }

      // Insert states
      let insertedStates: { id: string; fmgId: number }[] = [];
      if (parsed.states.length > 0) {
        insertedStates = await app.db
          .insert(states)
          .values(parsed.states.map((s) => ({ ...s, worldId })))
          .returning({ id: states.id, fmgId: states.fmgId });
      }

      // Build fmgId → uuid map for states
      const stateMap = new Map(insertedStates.map((s) => [s.fmgId, s.id]));

      // Insert burgs with state references
      let insertedBurgs: { id: string; fmgId: number }[] = [];
      if (parsed.burgs.length > 0) {
        const burgValues = parsed.burgs.map((b) => {
          const { fmgStateId, ...rest } = b as typeof b & { fmgStateId: number };
          return {
            ...rest,
            worldId,
            stateId: stateMap.get(fmgStateId) ?? null,
          };
        });

        insertedBurgs = await app.db
          .insert(burgs)
          .values(burgValues)
          .returning({ id: burgs.id, fmgId: burgs.fmgId });
      }

      // Store raw FMG data on world
      await app.db
        .update(worlds)
        .set({
          fmgData: fmgData,
          seed: fmgData.info?.seed ?? world.seed,
          updatedAt: new Date(),
        })
        .where(eq(worlds.id, worldId));

      return reply.status(200).send({
        imported: {
          states: insertedStates.length,
          burgs: insertedBurgs.length,
          cultures: insertedCultures.length,
          religions: insertedReligions.length,
        },
      });
    }
  );
}
