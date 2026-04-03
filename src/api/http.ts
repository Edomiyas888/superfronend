import {
  getFallbackUrls,
  getSwarmApiUrl,
  swarmHttpFallbackEnabled,
  useSwarmWebSocketTransport,
} from './config';
import { swarmPostViaWebSocket } from './swarmWebSocket';
import type { SwarmEnvelope, SwarmResponse } from './swarmTypes';

export type { SwarmEnvelope, SwarmResponse } from './swarmTypes';

function shortBody(text: string): string {
  const t = text.trimStart();
  if (t.startsWith('<!') || t.includes('<!DOCTYPE')) {
    return '[HTML from upstream — not Swarm JSON. Check superbet-api `SWARM_UPSTREAM` and that the host returns JSON to your server.]';
  }
  return t.slice(0, 180);
}

function httpErrorHint(status: number): string {
  if (status === 530) {
    return ' Upstream 530. Set `SWARM_UPSTREAM` in superbet-api to a Swarm origin that allows your server, or use `VITE_SWARM_TRANSPORT=websocket` for direct browser WS.';
  }
  if (status === 502) {
    return ' Is superbet-api running? If the body mentions upstream_html, fix `SWARM_UPSTREAM` on the server or try WebSocket transport.';
  }
  if (status === 503) {
    return ' Service unavailable — check `VITE_SWARM_API_URL` (should point at superbet-api).';
  }
  return '';
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();

  if (!res.ok) {
    try {
      const j = JSON.parse(text) as { message?: string; error?: string };
      if (j?.message) {
        throw new Error(`HTTP ${res.status}: ${j.message}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith('HTTP ')) {
        throw e;
      }
    }
    const hint = httpErrorHint(res.status);
    throw new Error(`HTTP ${res.status}: ${res.statusText}.${hint} ${shortBody(text)}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Invalid JSON from API (got ${text.slice(0, 80)}…). ${text.trimStart().startsWith('<') ? 'Got HTML — adjust `SWARM_UPSTREAM` on superbet-api or use WebSocket (`VITE_SWARM_TRANSPORT=websocket`).' : ''}`
    );
  }
}

async function swarmPostHttp<T>(envelope: SwarmEnvelope): Promise<SwarmResponse<T>> {
  const urls = [getSwarmApiUrl(), ...getFallbackUrls()];
  let lastErr: unknown;
  for (const base of urls) {
    try {
      return await postJson<SwarmResponse<T>>(base, envelope);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

export async function swarmPost<T = unknown>(envelope: SwarmEnvelope): Promise<SwarmResponse<T>> {
  const tryWs = useSwarmWebSocketTransport();
  if (tryWs) {
    try {
      return await swarmPostViaWebSocket<T>(envelope);
    } catch (e) {
      if (!swarmHttpFallbackEnabled()) {
        throw e instanceof Error ? e : new Error(String(e));
      }
      console.warn('[swarm] WebSocket request failed, using HTTP fallback:', e);
    }
  }
  return swarmPostHttp<T>(envelope);
}

export function unwrapData<T>(res: SwarmResponse<T>): T | undefined {
  if (res.code != null && res.code !== 0) {
    const msg = res.msg ?? `API code ${res.code}`;
    throw new Error(msg);
  }
  return res.data;
}
