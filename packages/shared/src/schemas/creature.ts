import { z } from "zod";

export const creatureCategoryEnum = z.enum(["solo", "pack", "swarm"]);
export const threatLevelEnum = z.enum([
  "harmless",
  "nuisance",
  "dangerous",
  "deadly",
  "legendary",
]);
export const creatureBehaviorEnum = z.enum([
  "territorial",
  "nomadic",
  "predatory",
  "passive",
  "intelligent",
]);
export const creatureIntelligenceEnum = z.enum(["beast", "cunning", "sentient"]);
export const creatureStatusEnum = z.enum(["alive", "dead", "dormant", "banished"]);

export const creatureSchema = z.object({
  id: z.string().uuid(),
  worldId: z.string().uuid(),
  name: z.string().min(1),
  species: z.string().min(1),
  category: creatureCategoryEnum,
  threatLevel: threatLevelEnum,
  habitat: z.string(),
  homeCell: z.number().int().optional(),
  lairBurgId: z.string().uuid().optional(),
  stateId: z.string().uuid().optional(),
  population: z.number().int().positive().default(1),
  abilities: z.record(z.unknown()).optional(),
  behavior: creatureBehaviorEnum,
  intelligence: creatureIntelligenceEnum,
  hostility: z.number().min(0).max(100).default(50),
  treasure: z.array(z.record(z.unknown())).optional(),
  biography: z.string().optional(),
  status: creatureStatusEnum.default("alive"),
  spawnTick: z.number().int().nonnegative().default(0),
  deathTick: z.number().int().nonnegative().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Creature = z.infer<typeof creatureSchema>;
export type CreatureCategory = z.infer<typeof creatureCategoryEnum>;
export type ThreatLevel = z.infer<typeof threatLevelEnum>;
export type CreatureBehavior = z.infer<typeof creatureBehaviorEnum>;
export type CreatureIntelligence = z.infer<typeof creatureIntelligenceEnum>;
export type CreatureStatus = z.infer<typeof creatureStatusEnum>;
