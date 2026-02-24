import { Queue, Worker } from "bullmq";
import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type Redis from "ioredis";
import type { SimSpeed, TickResult } from "@letopisets/shared/schemas/simulation";
import * as schema from "../db/schema.js";
import { processTick } from "./tick.js";

const SPEED_INTERVALS: Record<SimSpeed, number> = {
  slow: 30000,
  normal: 15000,
  fast: 5000,
};

interface EngineCallbacks {
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
  onSimStatus?: (worldId: string, status: string, speed?: SimSpeed) => void;
}

export class SimulationEngine {
  private queue: Queue;
  private worker: Worker;
  private callbacks: EngineCallbacks;
  private worldSpeeds = new Map<string, SimSpeed>();

  constructor(
    private db: PostgresJsDatabase<typeof schema>,
    redis: Redis,
    callbacks: EngineCallbacks = {},
  ) {
    this.callbacks = callbacks;

    const connection = {
      host: redis.options.host ?? "localhost",
      port: redis.options.port ?? 6379,
      password: redis.options.password as string | undefined,
      db: redis.options.db ?? 0,
    };

    this.queue = new Queue("simulation", { connection });

    this.worker = new Worker(
      "simulation",
      async (job) => {
        const { worldId } = job.data as { worldId: string };
        await processTick(this.db, worldId, {
          onTickStart: this.callbacks.onTickStart,
          onEventCreated: this.callbacks.onEventCreated,
          onTickComplete: this.callbacks.onTickComplete,
        });
      },
      { connection, concurrency: 1 },
    );

    this.worker.on("failed", (job, err) => {
      console.error(`Tick job failed for world ${job?.data?.worldId}:`, err.message);
    });
  }

  async start(worldId: string, speed: SimSpeed = "normal"): Promise<void> {
    this.worldSpeeds.set(worldId, speed);

    // Update DB status
    await this.db
      .update(schema.worlds)
      .set({ simStatus: "running", updatedAt: new Date() })
      .where(eq(schema.worlds.id, worldId));

    // Remove any existing repeatable for this world
    await this.removeRepeatable(worldId);

    // Add repeatable job
    const interval = SPEED_INTERVALS[speed];
    await this.queue.add(
      "tick",
      { worldId },
      {
        repeat: {
          every: interval,
          key: `sim:${worldId}`,
        },
        jobId: `sim:${worldId}`,
      },
    );

    this.callbacks.onSimStatus?.(worldId, "running", speed);
  }

  async pause(worldId: string): Promise<void> {
    await this.removeRepeatable(worldId);
    this.worldSpeeds.delete(worldId);

    await this.db
      .update(schema.worlds)
      .set({ simStatus: "paused", updatedAt: new Date() })
      .where(eq(schema.worlds.id, worldId));

    this.callbacks.onSimStatus?.(worldId, "paused");
  }

  async step(worldId: string): Promise<void> {
    // Add a single tick job
    await this.queue.add("tick", { worldId }, {
      jobId: `sim-step:${worldId}:${Date.now()}`,
    });
  }

  async stop(worldId: string): Promise<void> {
    await this.removeRepeatable(worldId);
    this.worldSpeeds.delete(worldId);

    await this.db
      .update(schema.worlds)
      .set({ simStatus: "idle", updatedAt: new Date() })
      .where(eq(schema.worlds.id, worldId));

    this.callbacks.onSimStatus?.(worldId, "idle");
  }

  async getStatus(worldId: string): Promise<{
    status: string;
    speed?: SimSpeed;
    currentTick: number;
  }> {
    const [world] = await this.db
      .select({
        simStatus: schema.worlds.simStatus,
        currentTick: schema.worlds.currentTick,
      })
      .from(schema.worlds)
      .where(eq(schema.worlds.id, worldId))
      .limit(1);

    if (!world) throw new Error(`World ${worldId} not found`);

    return {
      status: world.simStatus,
      speed: this.worldSpeeds.get(worldId),
      currentTick: world.currentTick,
    };
  }

  async close(): Promise<void> {
    await this.worker.close();
    await this.queue.close();
  }

  private async removeRepeatable(worldId: string): Promise<void> {
    const repeatableJobs = await this.queue.getRepeatableJobs();
    for (const job of repeatableJobs) {
      if (job.key === `sim:${worldId}`) {
        await this.queue.removeRepeatableByKey(job.key);
      }
    }
  }
}
