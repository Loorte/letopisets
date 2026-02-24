import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";

const clients = new Set<WebSocket>();
const worldSubscriptions = new Map<string, Set<WebSocket>>();

export async function wsHandler(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    clients.add(socket);

    socket.on("message", (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const message = JSON.parse(raw.toString());
        app.log.info({ msg: "ws message received", type: message.type });

        if (message.type === "subscribe" && message.worldId) {
          subscribeToWorld(socket, message.worldId);
        } else if (message.type === "unsubscribe" && message.worldId) {
          unsubscribeFromWorld(socket, message.worldId);
        }
      } catch {
        app.log.warn("Invalid WebSocket message");
      }
    });

    socket.on("close", () => {
      clients.delete(socket);
      // Remove from all world subscriptions
      for (const [, subs] of worldSubscriptions) {
        subs.delete(socket);
      }
    });
  });
}

function subscribeToWorld(socket: WebSocket, worldId: string) {
  let subs = worldSubscriptions.get(worldId);
  if (!subs) {
    subs = new Set();
    worldSubscriptions.set(worldId, subs);
  }
  subs.add(socket);
}

function unsubscribeFromWorld(socket: WebSocket, worldId: string) {
  const subs = worldSubscriptions.get(worldId);
  if (subs) {
    subs.delete(socket);
    if (subs.size === 0) {
      worldSubscriptions.delete(worldId);
    }
  }
}

export function broadcast(data: unknown) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}

export function broadcastToWorld(worldId: string, data: unknown) {
  const subs = worldSubscriptions.get(worldId);
  if (!subs) return;

  const payload = JSON.stringify(data);
  for (const client of subs) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}
