CREATE TYPE "public"."creature_behavior" AS ENUM('territorial', 'nomadic', 'predatory', 'passive', 'intelligent');--> statement-breakpoint
CREATE TYPE "public"."creature_category" AS ENUM('solo', 'pack', 'swarm');--> statement-breakpoint
CREATE TYPE "public"."creature_intelligence" AS ENUM('beast', 'cunning', 'sentient');--> statement-breakpoint
CREATE TYPE "public"."creature_status" AS ENUM('alive', 'dead', 'dormant', 'banished');--> statement-breakpoint
CREATE TYPE "public"."culture_type" AS ENUM('nomadic', 'river', 'lake', 'naval', 'hunting', 'highland', 'generic');--> statement-breakpoint
CREATE TYPE "public"."diplomatic_relation" AS ENUM('alliance', 'friendly', 'neutral', 'rival', 'war');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('political', 'economic', 'military', 'social', 'natural', 'magical', 'creature');--> statement-breakpoint
CREATE TYPE "public"."government_form" AS ENUM('monarchy', 'republic', 'theocracy', 'tribal', 'empire', 'anarchy');--> statement-breakpoint
CREATE TYPE "public"."memory_type" AS ENUM('working', 'long_term', 'reflective');--> statement-breakpoint
CREATE TYPE "public"."npc_role" AS ENUM('ruler', 'general', 'merchant', 'priest', 'spy', 'scholar', 'peasant', 'adventurer');--> statement-breakpoint
CREATE TYPE "public"."religion_type" AS ENUM('folk', 'organized', 'cult', 'heresy');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('minor', 'moderate', 'major', 'catastrophic');--> statement-breakpoint
CREATE TYPE "public"."sim_status" AS ENUM('idle', 'running', 'paused');--> statement-breakpoint
CREATE TYPE "public"."threat_level" AS ENUM('harmless', 'nuisance', 'dangerous', 'deadly', 'legendary');--> statement-breakpoint
CREATE TABLE "agent_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"agent_type" text NOT NULL,
	"memory_type" "memory_type" NOT NULL,
	"content" text NOT NULL,
	"importance" real DEFAULT 0.5 NOT NULL,
	"tick" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "burgs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"state_id" uuid,
	"fmg_id" integer NOT NULL,
	"name" text NOT NULL,
	"population" integer DEFAULT 0 NOT NULL,
	"is_capital" boolean DEFAULT false NOT NULL,
	"is_port" boolean DEFAULT false NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"economy" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creatures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"name" text NOT NULL,
	"species" text NOT NULL,
	"category" "creature_category" NOT NULL,
	"threat_level" "threat_level" NOT NULL,
	"habitat" text NOT NULL,
	"home_cell" integer,
	"lair_burg_id" uuid,
	"state_id" uuid,
	"population" integer DEFAULT 1 NOT NULL,
	"abilities" jsonb,
	"behavior" "creature_behavior" NOT NULL,
	"intelligence" "creature_intelligence" NOT NULL,
	"hostility" real DEFAULT 50 NOT NULL,
	"treasure" jsonb,
	"biography" text,
	"status" "creature_status" DEFAULT 'alive' NOT NULL,
	"spawn_tick" integer DEFAULT 0 NOT NULL,
	"death_tick" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"fmg_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "culture_type" NOT NULL,
	"color" text,
	"traits" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diplomatic_relations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"state_a_id" uuid NOT NULL,
	"state_b_id" uuid NOT NULL,
	"relation" "diplomatic_relation" DEFAULT 'neutral' NOT NULL,
	"since" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "npcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"state_id" uuid,
	"burg_id" uuid,
	"name" text NOT NULL,
	"role" "npc_role" NOT NULL,
	"traits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"relationships" jsonb,
	"biography" text,
	"is_alive" boolean DEFAULT true NOT NULL,
	"spawn_tick" integer DEFAULT 0 NOT NULL,
	"death_tick" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "religions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"fmg_id" integer NOT NULL,
	"name" text NOT NULL,
	"type" "religion_type" NOT NULL,
	"deity" text,
	"color" text,
	"tenets" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"fmg_id" integer NOT NULL,
	"name" text NOT NULL,
	"form" "government_form" NOT NULL,
	"color" text,
	"population" integer DEFAULT 0 NOT NULL,
	"military" real DEFAULT 0 NOT NULL,
	"economy" real DEFAULT 0 NOT NULL,
	"stability" real DEFAULT 50 NOT NULL,
	"diplomacy" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trade_routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"source_burg_id" uuid NOT NULL,
	"target_burg_id" uuid NOT NULL,
	"goods" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"revenue" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "world_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"tick" integer NOT NULL,
	"type" "event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"severity" "severity" NOT NULL,
	"effects" jsonb,
	"related_entity_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "world_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"world_id" uuid NOT NULL,
	"tick" integer NOT NULL,
	"snapshot" jsonb NOT NULL,
	"fmg_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"seed" text,
	"current_tick" integer DEFAULT 0 NOT NULL,
	"sim_status" "sim_status" DEFAULT 'idle' NOT NULL,
	"fmg_data" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burgs" ADD CONSTRAINT "burgs_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "burgs" ADD CONSTRAINT "burgs_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_lair_burg_id_burgs_id_fk" FOREIGN KEY ("lair_burg_id") REFERENCES "public"."burgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creatures" ADD CONSTRAINT "creatures_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultures" ADD CONSTRAINT "cultures_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomatic_relations" ADD CONSTRAINT "diplomatic_relations_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomatic_relations" ADD CONSTRAINT "diplomatic_relations_state_a_id_states_id_fk" FOREIGN KEY ("state_a_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diplomatic_relations" ADD CONSTRAINT "diplomatic_relations_state_b_id_states_id_fk" FOREIGN KEY ("state_b_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "npcs" ADD CONSTRAINT "npcs_burg_id_burgs_id_fk" FOREIGN KEY ("burg_id") REFERENCES "public"."burgs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "religions" ADD CONSTRAINT "religions_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "states" ADD CONSTRAINT "states_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_routes" ADD CONSTRAINT "trade_routes_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_routes" ADD CONSTRAINT "trade_routes_source_burg_id_burgs_id_fk" FOREIGN KEY ("source_burg_id") REFERENCES "public"."burgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trade_routes" ADD CONSTRAINT "trade_routes_target_burg_id_burgs_id_fk" FOREIGN KEY ("target_burg_id") REFERENCES "public"."burgs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_events" ADD CONSTRAINT "world_events_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "world_snapshots" ADD CONSTRAINT "world_snapshots_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE cascade ON UPDATE no action;