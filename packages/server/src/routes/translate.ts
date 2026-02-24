import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { worlds, states, burgs, cultures, religions } from "../db/schema.js";
import { translateBatch, type TranslationItem } from "../services/translator.js";
import { config } from "../config.js";

export async function translateRoutes(app: FastifyInstance) {
  app.post<{ Params: { id: string } }>(
    "/worlds/:id/translate",
    async (request, reply) => {
      const worldId = request.params.id;

      if (!config.anthropic.apiKey) {
        return reply.status(503).send({
          error: "ANTHROPIC_API_KEY не настроен. Добавьте ключ в файл .env",
        });
      }

      const [world] = await app.db
        .select()
        .from(worlds)
        .where(eq(worlds.id, worldId));

      if (!world) {
        return reply.status(404).send({ error: "Мир не найден" });
      }

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      const send = (event: string, data: Record<string, unknown>) => {
        reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      try {
        // Load all entities
        const stateRows = await app.db
          .select({ id: states.id, name: states.name })
          .from(states)
          .where(eq(states.worldId, worldId));

        const cultureRows = await app.db
          .select({ id: cultures.id, name: cultures.name })
          .from(cultures)
          .where(eq(cultures.worldId, worldId));

        const religionRows = await app.db
          .select({
            id: religions.id,
            name: religions.name,
            deity: religions.deity,
          })
          .from(religions)
          .where(eq(religions.worldId, worldId));

        const burgRows = await app.db
          .select({ id: burgs.id, name: burgs.name })
          .from(burgs)
          .where(eq(burgs.worldId, worldId));

        const phases = [
          { key: "states", items: stateRows, entityType: "state" as const },
          {
            key: "cultures",
            items: cultureRows,
            entityType: "culture" as const,
          },
          {
            key: "religions",
            items: religionRows as TranslationItem[],
            entityType: "religion" as const,
          },
          { key: "burgs", items: burgRows, entityType: "burg" as const },
        ];

        const totalItems = phases.reduce((s, p) => s + p.items.length, 0);
        let translatedTotal = 0;

        send("start", { totalItems, phases: phases.map((p) => p.key) });

        for (const phase of phases) {
          if (phase.items.length === 0) continue;

          send("progress", {
            phase: phase.key,
            status: "translating",
            translated: translatedTotal,
            totalItems,
          });

          const results = await translateBatch(
            phase.items,
            phase.entityType,
            (done, _total) => {
              send("progress", {
                phase: phase.key,
                status: "translating",
                translated: translatedTotal + done,
                totalItems,
              });
            },
          );

          // Save translations to DB
          const resultMap = new Map(results.map((r) => [r.id, r]));

          for (const item of phase.items) {
            const tr = resultMap.get(item.id);
            if (!tr) continue;

            if (phase.entityType === "state") {
              await app.db
                .update(states)
                .set({ nameOriginal: item.name, name: tr.nameRu })
                .where(eq(states.id, item.id));
            } else if (phase.entityType === "burg") {
              await app.db
                .update(burgs)
                .set({ nameOriginal: item.name, name: tr.nameRu })
                .where(eq(burgs.id, item.id));
            } else if (phase.entityType === "culture") {
              await app.db
                .update(cultures)
                .set({ nameOriginal: item.name, name: tr.nameRu })
                .where(eq(cultures.id, item.id));
            } else if (phase.entityType === "religion") {
              const religionItem = item as TranslationItem;
              await app.db
                .update(religions)
                .set({
                  nameOriginal: item.name,
                  name: tr.nameRu,
                  ...(religionItem.deity
                    ? {
                        deityOriginal: religionItem.deity,
                        deity: tr.deityRu ?? religionItem.deity,
                      }
                    : {}),
                })
                .where(eq(religions.id, item.id));
            }
          }

          translatedTotal += phase.items.length;

          send("progress", {
            phase: phase.key,
            status: "done",
            translated: translatedTotal,
            totalItems,
          });
        }

        send("complete", { translated: translatedTotal });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        send("error", { message });
      } finally {
        reply.raw.end();
      }
    },
  );
}
