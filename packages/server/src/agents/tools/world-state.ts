import { eq, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../../db/schema.js";
import { getWorkingMemory, getLongTermMemory } from "../memory.js";
import type { WorldContext, DiplomaticRelationContext } from "../types.js";

export async function buildWorldContext(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  currentTick: number,
  agentType: string,
): Promise<WorldContext> {
  const [world] = await db
    .select({ name: schema.worlds.name })
    .from(schema.worlds)
    .where(eq(schema.worlds.id, worldId))
    .limit(1);

  const stateRows = await db
    .select({
      id: schema.states.id,
      name: schema.states.name,
      form: schema.states.form,
      population: schema.states.population,
      military: schema.states.military,
      economy: schema.states.economy,
      stability: schema.states.stability,
    })
    .from(schema.states)
    .where(eq(schema.states.worldId, worldId));

  const stateMap = new Map(stateRows.map((s) => [s.id, s.name]));

  const diploRows = await db
    .select({
      stateAId: schema.diplomaticRelations.stateAId,
      stateBId: schema.diplomaticRelations.stateBId,
      relation: schema.diplomaticRelations.relation,
      since: schema.diplomaticRelations.since,
    })
    .from(schema.diplomaticRelations)
    .where(eq(schema.diplomaticRelations.worldId, worldId));

  const diplomaticRelations: DiplomaticRelationContext[] = diploRows.map((d) => ({
    stateAId: d.stateAId,
    stateAName: stateMap.get(d.stateAId) ?? "Unknown",
    stateBId: d.stateBId,
    stateBName: stateMap.get(d.stateBId) ?? "Unknown",
    relation: d.relation,
    since: d.since,
  }));

  const recentEvents = await db
    .select({
      tick: schema.worldEvents.tick,
      type: schema.worldEvents.type,
      title: schema.worldEvents.title,
      description: schema.worldEvents.description,
      severity: schema.worldEvents.severity,
    })
    .from(schema.worldEvents)
    .where(eq(schema.worldEvents.worldId, worldId))
    .orderBy(desc(schema.worldEvents.tick))
    .limit(10);

  const workingMemory = await getWorkingMemory(db, worldId, agentType);
  const longTermMemory = await getLongTermMemory(db, worldId, agentType);
  const memories = [...workingMemory, ...longTermMemory];

  return {
    worldId,
    worldName: world?.name ?? "Unknown",
    currentTick,
    states: stateRows,
    diplomaticRelations,
    recentEvents,
    memories,
  };
}
