import type { AgentAction } from "@letopisets/shared/schemas/simulation";

export interface WorldContext {
  worldId: string;
  worldName: string;
  currentTick: number;
  states: StateContext[];
  diplomaticRelations: DiplomaticRelationContext[];
  recentEvents: RecentEventContext[];
  memories: MemoryContext[];
}

export interface StateContext {
  id: string;
  name: string;
  form: string;
  population: number;
  military: number;
  economy: number;
  stability: number;
}

export interface DiplomaticRelationContext {
  stateAId: string;
  stateAName: string;
  stateBId: string;
  stateBName: string;
  relation: string;
  since: number;
}

export interface RecentEventContext {
  tick: number;
  type: string;
  title: string;
  description: string;
  severity: string;
}

export interface MemoryContext {
  content: string;
  importance: number;
  tick: number;
  memoryType: string;
}

export interface AgentResult {
  agentType: string;
  actions: AgentAction[];
  memory?: string;
  tokensUsed: number;
}
