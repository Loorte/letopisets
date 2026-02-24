import { eq, and } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema.js";
import type { AgentAction } from "@letopisets/shared/schemas/simulation";

interface AppliedEvent {
  id: string;
  tick: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  relatedEntityIds: string[];
}

export async function applyActions(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  tick: number,
  actions: AgentAction[],
): Promise<AppliedEvent[]> {
  const createdEvents: AppliedEvent[] = [];

  for (const action of actions) {
    switch (action.type) {
      case "modify_entity": {
        await applyModifyEntity(db, worldId, action);
        break;
      }
      case "create_event": {
        const event = await applyCreateEvent(db, worldId, tick, action);
        if (event) createdEvents.push(event);
        break;
      }
      case "diplomacy_action": {
        await applyDiplomacyAction(db, worldId, tick, action);
        break;
      }
    }
  }

  return createdEvents;
}

async function applyModifyEntity(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  action: Extract<AgentAction, { type: "modify_entity" }>,
): Promise<void> {
  const { entityType, entityId, changes } = action;

  // Only allow safe numeric/string field updates
  const safeChanges: Record<string, unknown> = {};
  const allowedFields: Record<string, string[]> = {
    state: ["stability", "economy", "military", "population"],
    burg: ["population", "economy"],
    culture: [],
    religion: [],
  };

  const allowed = allowedFields[entityType] ?? [];
  for (const [key, value] of Object.entries(changes)) {
    if (allowed.includes(key)) {
      safeChanges[key] = value;
    }
  }

  if (Object.keys(safeChanges).length === 0) return;

  const tableMap = {
    state: schema.states,
    burg: schema.burgs,
    culture: schema.cultures,
    religion: schema.religions,
  } as const;

  const table = tableMap[entityType];
  if (!table) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.update(table as any).set(safeChanges).where(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    and(eq((table as any).id, entityId), eq((table as any).worldId, worldId)),
  );
}

async function applyCreateEvent(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  tick: number,
  action: Extract<AgentAction, { type: "create_event" }>,
): Promise<AppliedEvent | null> {
  const [inserted] = await db
    .insert(schema.worldEvents)
    .values({
      worldId,
      tick,
      type: action.eventType,
      title: action.title,
      description: action.description,
      severity: action.severity,
      relatedEntityIds: action.relatedEntityIds,
      effects: action.effects ?? {},
    })
    .returning({
      id: schema.worldEvents.id,
      tick: schema.worldEvents.tick,
      type: schema.worldEvents.type,
      title: schema.worldEvents.title,
      description: schema.worldEvents.description,
      severity: schema.worldEvents.severity,
      relatedEntityIds: schema.worldEvents.relatedEntityIds,
    });

  if (!inserted) return null;

  return {
    ...inserted,
    relatedEntityIds: inserted.relatedEntityIds as string[],
  };
}

async function applyDiplomacyAction(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  tick: number,
  action: Extract<AgentAction, { type: "diplomacy_action" }>,
): Promise<void> {
  const { stateAId, stateBId, newRelation } = action;

  // Normalize order so stateAId < stateBId
  const [normA, normB] = stateAId < stateBId ? [stateAId, stateBId] : [stateBId, stateAId];

  const existing = await db
    .select({ id: schema.diplomaticRelations.id })
    .from(schema.diplomaticRelations)
    .where(
      and(
        eq(schema.diplomaticRelations.worldId, worldId),
        eq(schema.diplomaticRelations.stateAId, normA),
        eq(schema.diplomaticRelations.stateBId, normB),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(schema.diplomaticRelations)
      .set({ relation: newRelation, since: tick })
      .where(eq(schema.diplomaticRelations.id, existing[0]!.id));
  } else {
    await db.insert(schema.diplomaticRelations).values({
      worldId,
      stateAId: normA,
      stateBId: normB,
      relation: newRelation,
      since: tick,
    });
  }
}
