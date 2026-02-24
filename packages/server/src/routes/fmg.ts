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

      // FMG exports nest entities under `pack`
      const raw = request.body as Record<string, unknown>;
      const pack = (raw.pack ?? raw) as Record<string, unknown>;
      const info = raw.info as FmgMapData["info"] | undefined;

      if (!pack || !pack.states || !pack.burgs) {
        return reply.status(400).send({ error: "Некорректный формат FMG JSON" });
      }

      const fmgData: FmgMapData = {
        info: info ?? ({} as FmgMapData["info"]),
        settings: (raw.settings ?? {}) as FmgMapData["settings"],
        cells: (pack.cells ? { cells: [], features: [], biomes: [] } : { cells: [], features: [], biomes: [] }) as FmgMapData["cells"],
        states: pack.states as FmgMapData["states"],
        burgs: pack.burgs as FmgMapData["burgs"],
        cultures: (pack.cultures ?? []) as FmgMapData["cultures"],
        religions: (pack.religions ?? []) as FmgMapData["religions"],
        rivers: (pack.rivers ?? []) as FmgMapData["rivers"],
        markers: (pack.markers ?? []) as FmgMapData["markers"],
        notes: (raw.notes ?? []) as FmgMapData["notes"],
      };

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

      // Store FMG info on world (not the full JSON — too large)
      await app.db
        .update(worlds)
        .set({
          fmgData: { info: fmgData.info, settings: fmgData.settings },
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
