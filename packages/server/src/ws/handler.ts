import type { FastifyInstance } from "fastify";
import type { WebSocket } from "@fastify/websocket";

const clients = new Set<WebSocket>();

export async function wsHandler(app: FastifyInstance) {
  app.get("/ws", { websocket: true }, (socket) => {
    clients.add(socket);

    socket.on("message", (raw: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const message = JSON.parse(raw.toString());
        app.log.info({ msg: "ws message received", type: message.type });
      } catch {
        app.log.warn("Invalid WebSocket message");
      }
    });

    socket.on("close", () => {
      clients.delete(socket);
    });
  });
}

export function broadcast(data: unknown) {
  const payload = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === 1) {
      client.send(payload);
    }
  }
}
