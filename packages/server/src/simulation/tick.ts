import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { TickResult } from "@letopisets/shared/schemas/simulation";
import * as schema from "../db/schema.js";
import { buildWorldContext } from "../agents/tools/world-state.js";
import { applyActions } from "../agents/tools/apply-actions.js";
import { saveMemory } from "../agents/memory.js";
import { runOrchestrator } from "../agents/orchestrator.js";
import { runPoliticsAgent } from "../agents/politics.js";
import type { AgentResult } from "../agents/types.js";

interface TickCallbacks {
  onTickStart?: (worldId: string, tick: number) => void;
  onEventCreated?: (worldId: string, event: {
    id: string;
    tick: number;
    type: string;
    title: string;
    description: string;
    severity: string;
    relatedEntityIds: string[];
  }) => void;
  onTickComplete?: (worldId: string, result: TickResult) => void;
}

const agentRunners: Record<string, (ctx: Awaited<ReturnType<typeof buildWorldContext>>) => Promise<AgentResult>> = {
  politics: runPoliticsAgent,
};

export async function processTick(
  db: PostgresJsDatabase<typeof schema>,
  worldId: string,
  callbacks?: TickCallbacks,
): Promise<TickResult> {
  // 1. Load world & verify status
  const [world] = await db
    .select({
      id: schema.worlds.id,
      currentTick: schema.worlds.currentTick,
      simStatus: schema.worlds.simStatus,
    })
    .from(schema.worlds)
    .where(eq(schema.worlds.id, worldId))
    .limit(1);

  if (!world) throw new Error(`World ${worldId} not found`);

  // 2. Calculate next tick
  const nextTick = world.currentTick + 1;

  // 3. Broadcast tick:start
  callbacks?.onTickStart?.(worldId, nextTick);

  // 4. Build world context
  const ctx = await buildWorldContext(db, worldId, world.currentTick, "orchestrator");

  // 5. Run orchestrator to decide which agents to call
  const { agents, tokensUsed: orchTokens } = await runOrchestrator(ctx);

  let totalTokens = orchTokens;
  let totalEventsCreated = 0;

  // 6. Run each agent
  for (const agentName of agents) {
    const runner = agentRunners[agentName];
    if (!runner) continue;

    // Build agent-specific context
    const agentCtx = await buildWorldContext(db, worldId, world.currentTick, agentName);
    const result = await runner(agentCtx);
    totalTokens += result.tokensUsed;

    // 7. Apply actions
    const createdEvents = await applyActions(db, worldId, nextTick, result.actions);
    totalEventsCreated += createdEvents.length;

    // Broadcast each created event
    for (const event of createdEvents) {
      callbacks?.onEventCreated?.(worldId, event);
    }

    // 8. Save agent memory
    if (result.memory) {
      await saveMemory(db, worldId, result.agentType, nextTick, result.memory);
    }
  }

  // 9. Update world tick
  await db
    .update(schema.worlds)
    .set({ currentTick: nextTick, updatedAt: new Date() })
    .where(eq(schema.worlds.id, worldId));

  // 10. Build and broadcast result
  const tickResult: TickResult = {
    worldId,
    tick: nextTick,
    agentsRun: agents.length,
    eventsCreated: totalEventsCreated,
    tokensUsed: totalTokens,
  };

  callbacks?.onTickComplete?.(worldId, tickResult);

  return tickResult;
}
