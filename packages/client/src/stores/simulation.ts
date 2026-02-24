import { create } from "zustand";

export type SimStatus = "idle" | "running" | "paused";
export type SimSpeed = "slow" | "normal" | "fast";

export interface TimelineEvent {
  id: string;
  tick: number;
  type: string;
  title: string;
  description: string;
  severity: string;
  relatedEntityIds: string[];
}

export interface TickResult {
  worldId: string;
  tick: number;
  agentsRun: number;
  eventsCreated: number;
  tokensUsed: number;
}

interface SimulationState {
  status: SimStatus;
  speed: SimSpeed;
  currentTick: number;
  processingTick: number | null;
  events: TimelineEvent[];
  lastTickResult: TickResult | null;

  setStatus: (status: SimStatus) => void;
  setSpeed: (speed: SimSpeed) => void;
  setCurrentTick: (tick: number) => void;
  setProcessingTick: (tick: number | null) => void;
  addEvent: (event: TimelineEvent) => void;
  setEvents: (events: TimelineEvent[]) => void;
  appendEvents: (events: TimelineEvent[]) => void;
  setLastTickResult: (result: TickResult | null) => void;
  reset: () => void;
}

export const useSimulationStore = create<SimulationState>((set) => ({
  status: "idle",
  speed: "normal",
  currentTick: 0,
  processingTick: null,
  events: [],
  lastTickResult: null,

  setStatus: (status) => set({ status }),
  setSpeed: (speed) => set({ speed }),
  setCurrentTick: (currentTick) => set({ currentTick }),
  setProcessingTick: (processingTick) => set({ processingTick }),
  addEvent: (event) =>
    set((state) => ({ events: [event, ...state.events] })),
  setEvents: (events) => set({ events }),
  appendEvents: (events) =>
    set((state) => ({ events: [...state.events, ...events] })),
  setLastTickResult: (lastTickResult) =>
    set({ lastTickResult, processingTick: null }),
  reset: () =>
    set({
      status: "idle",
      speed: "normal",
      currentTick: 0,
      processingTick: null,
      events: [],
      lastTickResult: null,
    }),
}));
