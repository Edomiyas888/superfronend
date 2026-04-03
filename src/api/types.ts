export type NormalizedSport = {
  id: number;
  name: string;
  alias: string;
  order?: number;
  gameCount?: number;
};

export type SwarmSportPayload = {
  sport?: Record<string, unknown>;
};

export function normalizeSportList(payload: unknown): NormalizedSport[] {
  if (!payload || typeof payload !== 'object') return [];
  let p = payload as SwarmSportPayload & { data?: { sport?: unknown } };
  if (p.sport == null && p.data && typeof p.data === 'object' && p.data !== null && 'sport' in p.data) {
    p = { sport: (p.data as SwarmSportPayload).sport } as SwarmSportPayload;
  }
  const src = p.sport;
  if (!src || typeof src !== 'object') return [];
  const list = Object.values(src) as Record<string, unknown>[];
  return list
    .map((s) => ({
      id: Number(s.id),
      name: String(s.name ?? ''),
      alias: String(s.alias ?? ''),
      order: s.order !== undefined ? Number(s.order) : undefined,
      gameCount: s.game !== undefined ? Number(s.game) : undefined,
    }))
    .filter((s) => Number.isFinite(s.id))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export type FlatGameRow = {
  id: number;
  sport_id: number;
  sport_name: string;
  region_id: number;
  region_name: string;
  competition_id: number;
  competition_name: string;
  home_team: string;
  away_team: string;
  start_time: string;
  is_live: boolean;
  is_blocked: boolean;
  markets?: unknown[];
  home_score?: number;
  away_score?: number;
};

/** Home / Draw / Away prices for the main Match Result (1X2) market when Swarm returns nested `market` + `event`. */
export type MatchResult1x2Odds = {
  marketId: number;
  marketName: string;
  home: { eventId: number; price: number; name: string };
  draw: { eventId: number; price: number; name: string };
  away: { eventId: number; price: number; name: string };
};

export type GameView = {
  id: number;
  team1: string;
  team2: string;
  team1Id?: number;
  team2Id?: number;
  startTs: number;
  isLive: boolean;
  isBlocked: boolean;
  sportId: number;
  sportName: string;
  regionName: string;
  competitionName: string;
  marketsCount: number;
  /** When present, excludes fixture from “popular” lists (Finix Top Matches uses promoted). */
  promoted?: boolean;
  /** Parsed from nested `game.market` when present (upcoming / sport list queries). */
  matchResult1x2?: MatchResult1x2Odds;
};

export type MarketEventView = {
  id: number;
  name: string;
  price: number;
  type?: string | number;
  base?: number;
};

export type MarketView = {
  id: number;
  name: string;
  type?: string | number;
  displayKey?: string;
  homeScore?: number;
  awayScore?: number;
  events: MarketEventView[];
};

export type MatchDetailView = {
  gameId: number;
  team1: string;
  team2: string;
  startTs: number;
  isLive: boolean;
  sportId: number;
  sportName: string;
  regionName: string;
  competitionName: string;
  markets: MarketView[];
};
