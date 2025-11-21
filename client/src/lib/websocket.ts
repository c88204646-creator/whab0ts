// Referencing javascript_websocket blueprint
let socket: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
const listeners: Set<(message: any) => void> = new Set();

export function connectWebSocket() {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected');
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        listeners.forEach(listener => listener(message));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 5s...');
      socket = null;
      reconnectTimeout = setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  } catch (error) {
    console.error('Error connecting WebSocket:', error);
  }
}

export function sendWebSocketMessage(message: any) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  } else {
    console.warn('WebSocket not connected');
  }
}

export function subscribeToMessages(callback: (message: any) => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function disconnectWebSocket() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    socket.close();
    socket = null;
  }
  listeners.clear();
}
