/**
 * Browser WebSocket transport to BetConstruct Swarm (same envelope as finixbet `websocket.js` + `zergling.js`):
 * connect → `request_session` → send JSON `{ command, params, rid }` → responses match `rid`.
 */
import type { SwarmEnvelope, SwarmResponse } from './swarmTypes';
import { getSwarmLanguage, getSwarmSiteId, getSwarmSource, getSwarmWsUrl } from './config';

type Pending = { resolve: (v: SwarmResponse) => void; reject: (e: unknown) => void };

let socket: WebSocket | null = null;
let connectPromise: Promise<void> | null = null;
let sessionPromise: Promise<void> | null = null;
let callbackIdCounter = 0;
const callbacks = new Map<string, Pending>();

function getCallbackId(): string {
  callbackIdCounter += 1;
  if (callbackIdCounter > 100000) {
    callbackIdCounter = 0;
  }
  return `${Date.now()}${callbackIdCounter}`;
}

function frameToSwarmResponse(frame: Record<string, unknown>): SwarmResponse {
  if (typeof frame.code === 'number') {
    return {
      code: frame.code,
      data: frame.data as SwarmResponse['data'],
      msg: typeof frame.msg === 'string' ? frame.msg : undefined,
    };
  }
  const nested = frame.data;
  if (nested && typeof nested === 'object' && 'code' in nested) {
    const d = nested as Record<string, unknown>;
    return {
      code: typeof d.code === 'number' ? d.code : undefined,
      data: d.data as SwarmResponse['data'],
      msg: typeof d.msg === 'string' ? d.msg : undefined,
    };
  }
  // `{ rid, data: { sport: … } }` — Swarm payload without top-level `code`
  if (nested && typeof nested === 'object') {
    return {
      code: 0,
      data: nested as SwarmResponse['data'],
    };
  }
  return { data: frame as SwarmResponse['data'] };
}

function extractSessionSid(res: SwarmResponse): string | undefined {
  const d = res.data as Record<string, unknown> | undefined;
  if (!d) {
    return undefined;
  }
  if (typeof d.sid === 'string') {
    return d.sid;
  }
  const inner = d.data;
  if (inner && typeof inner === 'object' && 'sid' in inner) {
    const s = (inner as { sid?: string }).sid;
    return typeof s === 'string' ? s : undefined;
  }
  return undefined;
}

function onMessage(ev: MessageEvent<string>): void {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(ev.data) as Record<string, unknown>;
  } catch {
    return;
  }
  const rid = data.rid;
  if (rid != null && callbacks.has(String(rid))) {
    const pending = callbacks.get(String(rid))!;
    callbacks.delete(String(rid));
    pending.resolve(frameToSwarmResponse(data));
  }
}

function ensureSocket(): Promise<void> {
  const url = getSwarmWsUrl();
  if (!url) {
    return Promise.reject(new Error('VITE_SWARM_WS_URL is not set'));
  }
  if (socket?.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }
  if (connectPromise) {
    return connectPromise;
  }
  connectPromise = new Promise<void>((resolve, reject) => {
    try {
      const ws = new WebSocket(url);
      socket = ws;
      ws.onopen = () => {
        connectPromise = null;
        resolve();
      };
      ws.onerror = () => {
        connectPromise = null;
        reject(new Error('WebSocket connection failed'));
      };
      ws.onclose = () => {
        socket = null;
        connectPromise = null;
        sessionPromise = null;
        for (const [, p] of callbacks) {
          p.reject(new Error('WebSocket closed'));
        }
        callbacks.clear();
      };
      ws.onmessage = onMessage;
    } catch (e) {
      connectPromise = null;
      reject(e);
    }
  });
  return connectPromise;
}

function ensureSession(): Promise<void> {
  if (sessionPromise) {
    return sessionPromise;
  }
  sessionPromise = (async () => {
    await ensureSocket();
    const res = await sendRaw({
      command: 'request_session',
      params: {
        language: getSwarmLanguage(),
        site_id: getSwarmSiteId(),
        source: getSwarmSource(),
      },
    });
    if (res.code !== undefined && res.code !== 0) {
      throw new Error(res.msg ?? `request_session failed with code ${res.code}`);
    }
    if (!extractSessionSid(res)) {
      throw new Error('request_session: no sid in response');
    }
  })().catch((e) => {
    sessionPromise = null;
    throw e;
  });
  return sessionPromise;
}

function sendRaw(envelope: SwarmEnvelope & { rid?: string }): Promise<SwarmResponse> {
  return ensureSocket().then(
    () =>
      new Promise<SwarmResponse>((resolve, reject) => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          reject(new Error('WebSocket not open'));
          return;
        }
        const rid = getCallbackId();
        const payload = { ...envelope, rid };
        callbacks.set(rid, { resolve, reject });
        try {
          socket.send(JSON.stringify(payload));
        } catch (e) {
          callbacks.delete(rid);
          reject(e);
        }
      })
  );
}

export async function swarmPostViaWebSocket<T = unknown>(envelope: SwarmEnvelope): Promise<SwarmResponse<T>> {
  await ensureSession();
  const res = await sendRaw(envelope);
  return res as SwarmResponse<T>;
}
