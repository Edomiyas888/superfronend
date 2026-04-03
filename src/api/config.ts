/**
 * Swarm HTTP (default): browser → **superbet-api** (`VITE_SWARM_API_URL`) → `SWARM_UPSTREAM` on the server.
 * That backend is *your* replacement for legacy third-party `urlapi` hosts — you choose the upstream in `superbet-api/.env`.
 *
 * Optional: **WebSocket** — set `VITE_SWARM_TRANSPORT=websocket` and `VITE_SWARM_WS_URL` (finixbet-style, direct to BC).
 * Optional dev bypass: `VITE_SWARM_API_FALLBACKS=/bc-swarm/` (Vite proxy) if the API is not running.
 */
const DEFAULT_URL = 'http://localhost:3001/api/';

/**
 * superbet-api origin (no `/api` suffix) — used for `/v1/auth/*`, wallet, etc.
 * Set `VITE_API_URL` or derive from `VITE_SWARM_API_URL` (e.g. `http://localhost:3001/api/` → `http://localhost:3001`).
 */
export function getApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/$/, '');
  }
  const swarm = import.meta.env.VITE_SWARM_API_URL?.trim();
  if (swarm) {
    const base = swarm.replace(/\/api\/?$/i, '').replace(/\/$/, '');
    if (base) return base;
  }
  return 'http://localhost:3001';
}

export function getSwarmApiUrl(): string {
  const u = import.meta.env.VITE_SWARM_API_URL;
  if (u && u.trim()) {
    return u.trim().replace(/\/?$/, '/');
  }
  return DEFAULT_URL;
}

/** Direct browser → BetConstruct WS (same hosts as finixbet `Config.swarm.websocket`). */
export function getSwarmWsUrl(): string {
  const u = import.meta.env.VITE_SWARM_WS_URL;
  if (!u || !u.trim()) {
    return '';
  }
  return u.trim();
}

/** Opt-in: `VITE_SWARM_TRANSPORT=websocket` and `VITE_SWARM_WS_URL` — default Swarm path is HTTP via superbet-api. */
export function useSwarmWebSocketTransport(): boolean {
  return import.meta.env.VITE_SWARM_TRANSPORT === 'websocket' && Boolean(getSwarmWsUrl());
}

/** After a WS failure, try HTTP (`VITE_SWARM_API_URL`) unless this is `false`. */
export function swarmHttpFallbackEnabled(): boolean {
  return import.meta.env.VITE_SWARM_HTTP_FALLBACK !== 'false';
}

export function getSwarmSiteId(): number {
  const raw = import.meta.env.VITE_SWARM_SITE_ID;
  if (raw && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 1;
  }
  return 1;
}

/** Matches finixbet `Config.main.source` (used in `request_session` when using WS). */
export function getSwarmSource(): number {
  const raw = import.meta.env.VITE_SWARM_SOURCE;
  if (raw && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : 4;
  }
  return 4;
}

export function getSwarmLanguage(): string {
  const raw = import.meta.env.VITE_SWARM_LANGUAGE;
  return raw && raw.trim() ? raw.trim() : 'eng';
}

export function isRelativeSwarmBase(): boolean {
  return getSwarmApiUrl().startsWith('/');
}

export function getFallbackUrls(): string[] {
  const raw = import.meta.env.VITE_SWARM_API_FALLBACKS;
  if (!raw || !raw.trim()) {
    return [];
  }
  return raw
    .split(',')
    .map((s) => s.trim().replace(/\/?$/, '/'))
    .filter(Boolean);
}

export function useRestSportListOnly(): boolean {
  return import.meta.env.VITE_USE_REST_SPORT_LIST === 'true';
}
