import { z } from "zod";

export const npcRoleEnum = z.enum([
  "ruler",
  "general",
  "merchant",
  "priest",
  "spy",
  "scholar",
  "peasant",
  "adventurer",
]);

export const npcSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  stateId: z.string().uuid().optional(),
  burgId: z.string().uuid().optional(),
  name: z.string().min(1),
  role: npcRoleEnum,
  traits: z.array(z.string()).default([]),
  goals: z.array(z.string()).default([]),
  relationships: z.record(z.unknown()).optional(),
  biography: z.string().optional(),
  isAlive: z.boolean().default(true),
  spawnTick: z.number().int().nonnegative().default(0),
  deathTick: z.number().int().nonnegative().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Npc = z.infer<typeof npcSchema>;
export type NpcRole = z.infer<typeof npcRoleEnum>;
