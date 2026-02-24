import type { FmgMapData, FmgState, FmgBurg, FmgCulture, FmgReligion } from "@letopisets/shared/types/fmg";
import type { InferInsertModel } from "drizzle-orm";
import type { states, burgs, cultures, religions } from "../db/schema.js";

type InsertState = InferInsertModel<typeof states>;
type InsertBurg = InferInsertModel<typeof burgs>;
type InsertCulture = InferInsertModel<typeof cultures>;
type InsertReligion = InferInsertModel<typeof religions>;

const GOVERNMENT_MAP: Record<string, InsertState["form"]> = {
  Monarchy: "monarchy",
  Kingdom: "monarchy",
  Principality: "monarchy",
  Republic: "republic",
  Democracy: "republic",
  "City-state": "republic",
  Theocracy: "theocracy",
  Tribelands: "tribal",
  Horde: "tribal",
  Empire: "empire",
};

const CULTURE_TYPE_MAP: Record<string, InsertCulture["type"]> = {
  Nomadic: "nomadic",
  River: "river",
  Lake: "lake",
  Naval: "naval",
  Hunting: "hunting",
  Highland: "highland",
};

const RELIGION_TYPE_MAP: Record<string, InsertReligion["type"]> = {
  Folk: "folk",
  Organized: "organized",
  Cult: "cult",
  Heresy: "heresy",
};

function mapGovernmentForm(form: string): InsertState["form"] {
  return GOVERNMENT_MAP[form] ?? "anarchy";
}

function mapCultureType(type: string): InsertCulture["type"] {
  return CULTURE_TYPE_MAP[type] ?? "generic";
}

function mapReligionType(type: string): InsertReligion["type"] {
  return RELIGION_TYPE_MAP[type] ?? "folk";
}

export interface ParsedFmgData {
  states: Omit<InsertState, "worldId">[];
  burgs: Omit<InsertBurg, "worldId">[];
  cultures: Omit<InsertCulture, "worldId">[];
  religions: Omit<InsertReligion, "worldId">[];
}

// FMG arrays use index 0 as a placeholder (can be `0`, `null`, or an empty object)
function isValidEntry<T extends { i: number }>(entry: unknown): entry is T {
  return typeof entry === "object" && entry !== null && "i" in entry && (entry as T).i > 0;
}

export function parseFmgData(data: FmgMapData): ParsedFmgData {
  const validStates = data.states.filter(isValidEntry<FmgState>);
  const validBurgs = data.burgs.filter(isValidEntry<FmgBurg>);
  const validCultures = data.cultures.filter(isValidEntry<FmgCulture>);
  const validReligions = data.religions.filter(isValidEntry<FmgReligion>);

  // Build fmgId → state index map for burg references (resolved later with real UUIDs)
  const parsedStates = validStates.map((s: FmgState) => {
    const totalPopulation = (s.rural || 0) + (s.urban || 0);
    const militaryPower = s.military
      ? Math.min(s.military.reduce((sum, m) => sum + m.a, 0) / 100, 100)
      : 0;

    return {
      fmgId: s.i,
      name: s.name,
      form: mapGovernmentForm(s.form),
      color: s.color || null,
      population: Math.round(totalPopulation),
      military: Math.round(militaryPower * 10) / 10,
      economy: 50,
      stability: 50,
      diplomacy: s.diplomacy ? { raw: s.diplomacy } : null,
    };
  });

  const parsedBurgs = validBurgs.map((b: FmgBurg) => ({
    fmgId: b.i,
    fmgStateId: b.state,
    name: b.name,
    population: Math.round(b.population || 0),
    isCapital: b.capital === 1,
    isPort: b.port !== 0,
    x: b.x,
    y: b.y,
    economy: 50,
  }));

  const parsedCultures = validCultures.map((c: FmgCulture) => ({
    fmgId: c.i,
    name: c.name,
    type: mapCultureType(c.type),
    color: c.color || null,
    traits: null,
  }));

  const parsedReligions = validReligions.map((r: FmgReligion) => ({
    fmgId: r.i,
    name: r.name,
    type: mapReligionType(r.type),
    deity: r.deity || null,
    color: r.color || null,
    tenets: null,
  }));

  return {
    states: parsedStates,
    burgs: parsedBurgs,
    cultures: parsedCultures,
    religions: parsedReligions,
  };
}
