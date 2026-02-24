import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import {
  useSimulationStore,
  type SimSpeed,
  type TimelineEvent,
} from "../stores/simulation";

export function useSimulation(worldId: string | undefined) {
  const store = useSimulationStore();
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch initial simulation status
  useQuery({
    queryKey: ["simulation-status", worldId],
    queryFn: async () => {
      const data = await apiFetch<{
        status: string;
        speed?: SimSpeed;
        currentTick: number;
      }>(`/worlds/${worldId}/simulation/status`);
      store.setStatus(data.status as "idle" | "running" | "paused");
      if (data.speed) store.setSpeed(data.speed);
      store.setCurrentTick(data.currentTick);
      return data;
    },
    enabled: !!worldId,
    staleTime: 5_000,
  });

  // Fetch initial events
  useQuery({
    queryKey: ["world-events", worldId],
    queryFn: async () => {
      const events = await apiFetch<TimelineEvent[]>(
        `/worlds/${worldId}/events?limit=50`,
      );
      store.setEvents(events);
      return events;
    },
    enabled: !!worldId,
    staleTime: 10_000,
  });

  // WebSocket connection
  useEffect(() => {
    if (!worldId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "subscribe", worldId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case "tick:start":
            if (msg.worldId === worldId) {
              store.setProcessingTick(msg.tick);
            }
            break;

          case "tick:complete":
            if (msg.worldId === worldId) {
              store.setLastTickResult(msg.result);
              store.setCurrentTick(msg.result.tick);
              queryClient.invalidateQueries({ queryKey: ["world", worldId] });
            }
            break;

          case "sim:status":
            if (msg.worldId === worldId) {
              store.setStatus(msg.status);
              if (msg.speed) store.setSpeed(msg.speed);
            }
            break;

          case "event:created":
            if (msg.worldId === worldId) {
              store.addEvent(msg.event);
            }
            break;
        }
      } catch {
        // Ignore invalid messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "unsubscribe", worldId }));
      }
      ws.close();
      wsRef.current = null;
    };
  }, [worldId, store, queryClient]);

  const start = useCallback(
    async (speed?: SimSpeed) => {
      if (!worldId) return;
      await apiFetch(`/worlds/${worldId}/simulation/start`, {
        method: "POST",
        body: JSON.stringify({ speed: speed ?? store.speed }),
      });
    },
    [worldId, store.speed],
  );

  const pause = useCallback(async () => {
    if (!worldId) return;
    await apiFetch(`/worlds/${worldId}/simulation/pause`, {
      method: "POST",
    });
  }, [worldId]);

  const step = useCallback(async () => {
    if (!worldId) return;
    await apiFetch(`/worlds/${worldId}/simulation/step`, {
      method: "POST",
    });
  }, [worldId]);

  const stop = useCallback(async () => {
    if (!worldId) return;
    await apiFetch(`/worlds/${worldId}/simulation/stop`, {
      method: "POST",
    });
  }, [worldId]);

  const loadMoreEvents = useCallback(async () => {
    if (!worldId) return;
    const offset = store.events.length;
    const events = await apiFetch<TimelineEvent[]>(
      `/worlds/${worldId}/events?limit=50&offset=${offset}`,
    );
    store.appendEvents(events);
  }, [worldId, store]);

  return {
    ...store,
    start,
    pause,
    step,
    stop,
    loadMoreEvents,
  };
}
