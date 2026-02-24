type MessageHandler = (data: unknown) => void;

let socket: WebSocket | null = null;
const handlers = new Set<MessageHandler>();

export function connectWs() {
  if (socket?.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const url = `${protocol}//${window.location.host}/ws`;

  socket = new WebSocket(url);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      for (const handler of handlers) {
        handler(data);
      }
    } catch {
      console.warn("Invalid WebSocket message");
    }
  };

  socket.onclose = () => {
    setTimeout(connectWs, 3000);
  };
}

export function onWsMessage(handler: MessageHandler) {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

export function sendWsMessage(data: unknown) {
  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}
