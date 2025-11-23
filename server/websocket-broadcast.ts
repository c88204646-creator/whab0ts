import { WebSocket, WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export function setWebSocketServer(server: WebSocketServer) {
  wss = server;
}

export function broadcastMessage(message: any) {
  if (!wss) return;
  
  const data = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

export function broadcastNewMessage(conversationId: string, messageData: any) {
  broadcastMessage({
    type: "new_message",
    conversationId,
    data: messageData
  });
}
