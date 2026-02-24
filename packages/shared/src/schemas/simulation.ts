import { z } from "zod";
import { eventTypeEnum, severityEnum } from "./event.js";

// === Agent action types ===

export const modifyEntityActionSchema = z.object({
  type: z.literal("modify_entity"),
  entityType: z.enum(["state", "burg", "culture", "religion"]),
  entityId: z.string().uuid(),
  changes: z.record(z.unknown()),
});

export const createEventActionSchema = z.object({
  type: z.literal("create_event"),
  eventType: eventTypeEnum,
  title: z.string().min(1),
  description: z.string().min(1),
  severity: severityEnum,
  relatedEntityIds: z.array(z.string().uuid()).default([]),
  effects: z.record(z.unknown()).optional(),
});

export const diplomacyActionSchema = z.object({
  type: z.literal("diplomacy_action"),
  stateAId: z.string().uuid(),
  stateBId: z.string().uuid(),
  newRelation: z.enum(["alliance", "friendly", "neutral", "rival", "war"]),
  reason: z.string(),
});

export const agentActionSchema = z.discriminatedUnion("type", [
  modifyEntityActionSchema,
  createEventActionSchema,
  diplomacyActionSchema,
]);

export type AgentAction = z.infer<typeof agentActionSchema>;

// === Agent response ===

export const agentResponseSchema = z.object({
  actions: z.array(agentActionSchema).max(3),
  memory: z.string().optional(),
});

export type AgentResponse = z.infer<typeof agentResponseSchema>;

// === Tick result ===

export const tickResultSchema = z.object({
  worldId: z.string().uuid(),
  tick: z.number().int().nonnegative(),
  agentsRun: z.number().int().nonnegative(),
  eventsCreated: z.number().int().nonnegative(),
  tokensUsed: z.number().int().nonnegative(),
});

export type TickResult = z.infer<typeof tickResultSchema>;

// === Simulation speed ===

export const simSpeedEnum = z.enum(["slow", "normal", "fast"]);
export type SimSpeed = z.infer<typeof simSpeedEnum>;

// === WebSocket messages ===

export const wsTickStartSchema = z.object({
  type: z.literal("tick:start"),
  worldId: z.string().uuid(),
  tick: z.number().int(),
});

export const wsTickCompleteSchema = z.object({
  type: z.literal("tick:complete"),
  worldId: z.string().uuid(),
  result: tickResultSchema,
});

export const wsSimStatusSchema = z.object({
  type: z.literal("sim:status"),
  worldId: z.string().uuid(),
  status: z.enum(["idle", "running", "paused"]),
  speed: simSpeedEnum.optional(),
});

export const wsEventCreatedSchema = z.object({
  type: z.literal("event:created"),
  worldId: z.string().uuid(),
  event: z.object({
    id: z.string().uuid(),
    tick: z.number().int(),
    type: eventTypeEnum,
    title: z.string(),
    description: z.string(),
    severity: severityEnum,
    relatedEntityIds: z.array(z.string().uuid()),
  }),
});

export const wsMessageSchema = z.discriminatedUnion("type", [
  wsTickStartSchema,
  wsTickCompleteSchema,
  wsSimStatusSchema,
  wsEventCreatedSchema,
]);

export type WsMessage = z.infer<typeof wsMessageSchema>;
