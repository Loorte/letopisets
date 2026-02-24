import { eq, and, desc } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../db/schema.js";
import type { MemoryContext } from "./types.js";

export async function getWorkingMemory(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  agentType: string,
): Promise<MemoryContext[]> {
  const rows = await db
    .select({
      content: schema.agentMemories.content,
      importance: schema.agentMemories.importance,
      tick: schema.agentMemories.tick,
      memoryType: schema.agentMemories.memoryType,
    })
    .from(schema.agentMemories)
    .where(
      and(
        eq(schema.agentMemories.worldId, worldId),
        eq(schema.agentMemories.agentType, agentType),
        eq(schema.agentMemories.memoryType, "working"),
      ),
    )
    .orderBy(desc(schema.agentMemories.tick))
    .limit(5);

  return rows;
}

export async function getLongTermMemory(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  agentType: string,
): Promise<MemoryContext[]> {
  const rows = await db
    .select({
      content: schema.agentMemories.content,
      importance: schema.agentMemories.importance,
      tick: schema.agentMemories.tick,
      memoryType: schema.agentMemories.memoryType,
    })
    .from(schema.agentMemories)
    .where(
      and(
        eq(schema.agentMemories.worldId, worldId),
        eq(schema.agentMemories.agentType, agentType),
        eq(schema.agentMemories.memoryType, "long_term"),
      ),
    )
    .orderBy(desc(schema.agentMemories.importance))
    .limit(20);

  return rows;
}

export async function saveMemory(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  agentType: string,
  tick: number,
  content: string,
  importance: number = 0.5,
  memoryType: "working" | "long_term" = "working",
): Promise<void> {
  await db.insert(schema.agentMemories).values({
    worldId,
    agentType,
    memoryType,
    content,
    importance,
    tick,
  });
}
