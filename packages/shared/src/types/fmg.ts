/**
 * Type definitions for Azgaar Fantasy Map Generator data format.
 * Based on FMG "Full JSON" export structure.
 */

export interface FmgMapData {
  info: FmgInfo;
  settings: FmgSettings;
  cells: FmgCellsData;
  states: FmgState[];
  burgs: FmgBurg[];
  cultures: FmgCulture[];
  religions: FmgReligion[];
  rivers: FmgRiver[];
  markers: FmgMarker[];
  notes: FmgNote[];
}

export interface FmgInfo {
  version: string;
  description: string;
  exportedAt: string;
  mapName: string;
  seed: string;
  mapId: number;
}

export interface FmgSettings {
  distanceUnit: string;
  distanceScale: string;
  areaUnit: string;
  heightUnit: string;
  temperatureScale: string;
  populationRate: number;
  urbanization: number;
}

export interface FmgCellsData {
  cells: FmgCell[];
  features: FmgFeature[];
  biomes: FmgBiome[];
}

export interface FmgCell {
  i: number;
  h: number;
  t: number;
  f: number;
  biome: number;
  burg: number;
  culture: number;
  religion: number;
  state: number;
  pop: number;
}

export interface FmgFeature {
  i: number;
  type: string;
  cells: number;
  area: number;
}

export interface FmgBiome {
  i: number;
  name: string;
  color: string;
}

export interface FmgState {
  i: number;
  name: string;
  form: string;
  formName: string;
  color: string;
  capital: number;
  center: number;
  culture: number;
  type: string;
  expansionism: number;
  cells: number;
  area: number;
  burgs: number;
  rural: number;
  urban: number;
  military: FmgMilitary[];
  alert: number;
  diplomacy: number[];
}

export interface FmgMilitary {
  i: number;
  a: number;
  cell: number;
  x: number;
  y: number;
  name: string;
  state: number;
  icon: string;
}

export interface FmgBurg {
  i: number;
  name: string;
  cell: number;
  x: number;
  y: number;
  state: number;
  culture: number;
  feature: number;
  capital: number;
  port: number;
  population: number;
  type: string;
  citadel: number;
  walls: number;
  plaza: number;
  temple: number;
  shanty: number;
}

export interface FmgCulture {
  i: number;
  name: string;
  base: number;
  origins: number[];
  shield: string;
  center: number;
  color: string;
  type: string;
  expansionism: number;
  area: number;
  cells: number;
}

export interface FmgReligion {
  i: number;
  name: string;
  color: string;
  culture: number;
  type: string;
  form: string;
  deity: string;
  center: number;
  origin: number;
  area: number;
  cells: number;
}

export interface FmgRiver {
  i: number;
  name: string;
  cells: number[];
  source: number;
  mouth: number;
  length: number;
  width: number;
}

export interface FmgMarker {
  i: number;
  icon: string;
  type: string;
  x: number;
  y: number;
  cell: number;
}

export interface FmgNote {
  id: string;
  name: string;
  legend: string;
}
