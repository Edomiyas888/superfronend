import { getKenoWsUrl, useKenoWebSocket } from '@/api/config';
import type { KenoPublicState } from '@/features/keno/api/kenoApi';

export type KenoSocketMessage = {
  type: 'state';
  data: KenoPublicState;
};

const RECONNECT_MS = 2000;

export type KenoSocketHandlers = {
  onState: (state: KenoPublicState) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (message: string) => void;
};

/**
 * Subscribe to live Keno round + called-number updates via WebSocket.
 * Returns a cleanup function that closes the socket and cancels reconnect.
 */
export function subscribeKenoSocket(handlers: KenoSocketHandlers): () => void {
  if (!useKenoWebSocket()) {
    return () => {};
  }

  const wsUrl = getKenoWsUrl();
  if (!wsUrl) {
    return () => {};
  }

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const connect = () => {
    if (closed) return;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      handlers.onConnect?.();
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as KenoSocketMessage;
        if (message.type === 'state' && message.data) {
          handlers.onState(message.data);
        }
      } catch {
        handlers.onError?.('Invalid Keno socket message.');
      }
    };

    ws.onerror = () => {
      handlers.onError?.('Keno socket connection error.');
    };

    ws.onclose = () => {
      handlers.onDisconnect?.();
      ws = null;
      if (closed) return;
      reconnectTimer = setTimeout(connect, RECONNECT_MS);
    };
  };

  connect();

  return () => {
    closed = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
  };
}
