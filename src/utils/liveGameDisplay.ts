/**
 * Parse Swarm live game payloads for list UI (scores + clock).
 * Mirrors patterns from finix `LiveMatchesTable.jsx` / `game.info` usage.
 */

export function normalizeGameInfo(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      if (p && typeof p === 'object' && !Array.isArray(p)) return p as Record<string, unknown>;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export function parseLiveMinuteFromInfo(info: unknown): number | null {
  const o = normalizeGameInfo(info);
  if (!o) return null;
  const num = (v: unknown): number | null => {
    if (v === undefined || v === null) return null;
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    const m = String(v).match(/(\d{1,3})/);
    return m ? Number(m[1]) : null;
  };
  let m = num(o.minute);
  if (m != null && m > 0) return m;
  m = num(o.current_game_time);
  if (m != null && m > 0) return m;
  m = num(o.game_time);
  if (m != null && m > 0) return m;
  m = num(o.live_time);
  if (m != null && m > 0) return m;
  return null;
}

export function extractScoresFromGameMarkets(g: Record<string, unknown>): { home: number | null; away: number | null } {
  const safeNum = (v: unknown): number | null => {
    if (v === undefined || v === null || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const marketObj = (g.market as Record<string, unknown>) ?? {};
  for (const mk of Object.values(marketObj)) {
    const m = mk as Record<string, unknown>;
    const home = safeNum(m.home_score);
    const away = safeNum(m.away_score);
    if (home != null && away != null) return { home, away };
  }
  return { home: null, away: null };
}

export function formatLiveMatchTimeText(g: Record<string, unknown>): string {
  const text = String(g.text_info ?? '').trim();
  if (text.length > 1) return text;
  const info = normalizeGameInfo(g.info);
  if (!info) return '';
  const state = String(info.current_game_state ?? '').trim();
  const cgt = String(info.current_game_time ?? '').trim();
  if (state && cgt) return `${state} ${cgt}`;
  if (cgt) return cgt;
  if (state) return state;
  const minute = parseLiveMinuteFromInfo(info);
  if (minute != null && minute > 0) return `${minute}'`;
  return '';
}

export function liveDisplayFieldsFromRawGame(g: Record<string, unknown>): {
  homeScore?: number;
  awayScore?: number;
  liveMatchTime?: string;
} {
  const scores = extractScoresFromGameMarkets(g);
  const liveMatchTime = formatLiveMatchTimeText(g);
  const out: { homeScore?: number; awayScore?: number; liveMatchTime?: string } = {};
  if (scores.home != null && scores.away != null) {
    out.homeScore = scores.home;
    out.awayScore = scores.away;
  }
  if (liveMatchTime) out.liveMatchTime = liveMatchTime;
  return out;
}
