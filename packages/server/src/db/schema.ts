import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  real,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

// === Enums ===

export const simStatusEnum = pgEnum("sim_status", ["idle", "running", "paused"]);
export const governmentFormEnum = pgEnum("government_form", [
  "monarchy", "republic", "theocracy", "tribal", "empire", "anarchy",
]);
export const cultureTypeEnum = pgEnum("culture_type", [
  "nomadic", "river", "lake", "naval", "hunting", "highland", "generic",
]);
export const religionTypeEnum = pgEnum("religion_type", [
  "folk", "organized", "cult", "heresy",
]);
export const npcRoleEnum = pgEnum("npc_role", [
  "ruler", "general", "merchant", "priest", "spy", "scholar", "peasant", "adventurer",
]);
export const creatureCategoryEnum = pgEnum("creature_category", ["solo", "pack", "swarm"]);
export const threatLevelEnum = pgEnum("threat_level", [
  "harmless", "nuisance", "dangerous", "deadly", "legendary",
]);
export const creatureBehaviorEnum = pgEnum("creature_behavior", [
  "territorial", "nomadic", "predatory", "passive", "intelligent",
]);
export const creatureIntelligenceEnum = pgEnum("creature_intelligence", [
  "beast", "cunning", "sentient",
]);
export const creatureStatusEnum = pgEnum("creature_status", [
  "alive", "dead", "dormant", "banished",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "political", "economic", "military", "social", "natural", "magical", "creature",
]);
export const severityEnum = pgEnum("severity", [
  "minor", "moderate", "major", "catastrophic",
]);
export const memoryTypeEnum = pgEnum("memory_type", [
  "working", "long_term", "reflective",
]);
export const diplomaticRelationEnum = pgEnum("diplomatic_relation", [
  "alliance", "friendly", "neutral", "rival", "war",
]);

// === Tables ===

export const worlds = pgTable("worlds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  seed: text("seed"),
  currentTick: integer("current_tick").notNull().default(0),
  simStatus: simStatusEnum("sim_status").notNull().default("idle"),
  fmgData: jsonb("fmg_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const states = pgTable("states", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  fmgId: integer("fmg_id").notNull(),
  name: text("name").notNull(),
  form: governmentFormEnum("form").notNull(),
  color: text("color"),
  population: integer("population").notNull().default(0),
  military: real("military").notNull().default(0),
  economy: real("economy").notNull().default(0),
  stability: real("stability").notNull().default(50),
  diplomacy: jsonb("diplomacy"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const burgs = pgTable("burgs", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  stateId: uuid("state_id").references(() => states.id),
  fmgId: integer("fmg_id").notNull(),
  name: text("name").notNull(),
  population: integer("population").notNull().default(0),
  isCapital: boolean("is_capital").notNull().default(false),
  isPort: boolean("is_port").notNull().default(false),
  x: real("x").notNull(),
  y: real("y").notNull(),
  economy: real("economy").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cultures = pgTable("cultures", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  fmgId: integer("fmg_id").notNull(),
  name: text("name").notNull(),
  type: cultureTypeEnum("type").notNull(),
  color: text("color"),
  traits: jsonb("traits"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const religions = pgTable("religions", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  fmgId: integer("fmg_id").notNull(),
  name: text("name").notNull(),
  type: religionTypeEnum("type").notNull(),
  deity: text("deity"),
  color: text("color"),
  tenets: jsonb("tenets"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const npcs = pgTable("npcs", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  stateId: uuid("state_id").references(() => states.id),
  burgId: uuid("burg_id").references(() => burgs.id),
  name: text("name").notNull(),
  role: npcRoleEnum("role").notNull(),
  traits: jsonb("traits").notNull().default([]),
  goals: jsonb("goals").notNull().default([]),
  relationships: jsonb("relationships"),
  biography: text("biography"),
  isAlive: boolean("is_alive").notNull().default(true),
  spawnTick: integer("spawn_tick").notNull().default(0),
  deathTick: integer("death_tick"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const creatures = pgTable("creatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  species: text("species").notNull(),
  category: creatureCategoryEnum("category").notNull(),
  threatLevel: threatLevelEnum("threat_level").notNull(),
  habitat: text("habitat").notNull(),
  homeCell: integer("home_cell"),
  lairBurgId: uuid("lair_burg_id").references(() => burgs.id),
  stateId: uuid("state_id").references(() => states.id),
  population: integer("population").notNull().default(1),
  abilities: jsonb("abilities"),
  behavior: creatureBehaviorEnum("behavior").notNull(),
  intelligence: creatureIntelligenceEnum("intelligence").notNull(),
  hostility: real("hostility").notNull().default(50),
  treasure: jsonb("treasure"),
  biography: text("biography"),
  status: creatureStatusEnum("status").notNull().default("alive"),
  spawnTick: integer("spawn_tick").notNull().default(0),
  deathTick: integer("death_tick"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const worldEvents = pgTable("world_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  type: eventTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: severityEnum("severity").notNull(),
  effects: jsonb("effects"),
  relatedEntityIds: jsonb("related_entity_ids").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  agentType: text("agent_type").notNull(),
  memoryType: memoryTypeEnum("memory_type").notNull(),
  content: text("content").notNull(),
  importance: real("importance").notNull().default(0.5),
  tick: integer("tick").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const worldSnapshots = pgTable("world_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  tick: integer("tick").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  fmgData: jsonb("fmg_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const diplomaticRelations = pgTable("diplomatic_relations", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  stateAId: uuid("state_a_id").notNull().references(() => states.id, { onDelete: "cascade" }),
  stateBId: uuid("state_b_id").notNull().references(() => states.id, { onDelete: "cascade" }),
  relation: diplomaticRelationEnum("relation").notNull().default("neutral"),
  since: integer("since").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tradeRoutes = pgTable("trade_routes", {
  id: uuid("id").primaryKey().defaultRandom(),
  worldId: uuid("world_id").notNull().references(() => worlds.id, { onDelete: "cascade" }),
  sourceBurgId: uuid("source_burg_id").notNull().references(() => burgs.id, { onDelete: "cascade" }),
  targetBurgId: uuid("target_burg_id").notNull().references(() => burgs.id, { onDelete: "cascade" }),
  goods: jsonb("goods").notNull().default([]),
  revenue: real("revenue").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
