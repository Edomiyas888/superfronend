import { swarmPost, unwrapData } from './http';
import { MATCH_RESULT_TYPES, P1XP2_MARKET_TYPES } from './marketConstants';
import { pickTeamIdFromGame } from '../utils/teamLogos';
import type { SwarmResponse } from './swarmTypes';
import type { FlatGameRow, GameView, MarketView, MatchDetailView, MatchResult1x2Odds } from './types';

const SUB = { subscribe: true as const };

/** Set `localStorage.SUPERBET_SWARM_DEBUG=1` to log Swarm payloads even in production build. */
function swarmDebugEnabled(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('SUPERBET_SWARM_DEBUG') === '1';
  } catch {
    return false;
  }
}

function swarmLog(label: string, payload: unknown): void {
  if (!swarmDebugEnabled()) return;
  console.log(`[Superbet Swarm] ${label}`, payload);
}

/**
 * With `subscribe: true`, Swarm often returns `{ subid, data: { sport, region, … } }` instead of `{ sport }` at the top level.
 */
function unwrapGameTreePayload(data: unknown): unknown {
  if (data == null || typeof data !== 'object') {
    return data;
  }
  const d = data as Record<string, unknown>;
  if ('sport' in d && d.sport != null) {
    return data;
  }
  if ('subid' in d && d.data != null && typeof d.data === 'object') {
    const inner = d.data as Record<string, unknown>;
    if ('sport' in inner) {
      return inner;
    }
  }
  return data;
}

/** Shrink nested sport trees for console (avoid huge dumps). */
function summarizeSwarmData(data: unknown): unknown {
  if (data == null || typeof data !== 'object') {
    return data;
  }
  const d = data as Record<string, unknown>;
  if ('subid' in d && d.data != null && typeof d.data === 'object') {
    return {
      _shape: 'subscriptionEnvelope',
      subid: d.subid,
      inner: summarizeSwarmData(d.data),
    };
  }
  if (!('sport' in d) || d.sport == null || typeof d.sport !== 'object') {
    return { _keys: Object.keys(d) };
  }
  const sports = d.sport as Record<string, Record<string, unknown>>;
  const sportKeys = Object.keys(sports);
  const samples = sportKeys.slice(0, 3).map((k) => {
    const sp = sports[k];
    if (!sp) {
      return { key: k, missing: true };
    }
    const region = sp.region as Record<string, unknown> | undefined;
    const game = sp.game as Record<string, unknown> | undefined;
    return {
      key: k,
      id: sp.id,
      name: sp.name,
      alias: sp.alias,
      regionChildKeys: region ? Object.keys(region).length : 0,
      gameChildKeys: game ? Object.keys(game).length : 0,
    };
  });
  return { sportBucketCount: sportKeys.length, sampleSports: samples };
}

function logSwarmResponse(step: string, res: SwarmResponse): void {
  swarmLog(step, {
    code: res.code,
    msg: res.msg,
    data: summarizeSwarmData(res.data),
  });
}

function nestFromFlatRows(data: FlatGameRow[]): MatchDetailView | null {
  const g = data[0];
  if (!g) return null;
  const markets: MarketView[] = (g.markets as Record<string, unknown>[] | undefined)?.map((m) => {
    const mid = Number((m as { id?: unknown }).id);
    const odds = (m as { odds?: { id?: unknown; name?: unknown; value?: unknown }[] }).odds ?? [];
    return {
      id: mid,
      name: String((m as { name?: unknown }).name ?? ''),
      type: (m as { type?: unknown }).type as string | number | undefined,
      displayKey: (m as { display_key?: unknown }).display_key as string | undefined,
      homeScore: g.home_score,
      awayScore: g.away_score,
      events: odds.map((o) => ({
        id: Number(o.id),
        name: String(o.name ?? ''),
        price: Number(o.value),
        base: (m as { base?: unknown }).base as number | undefined,
      })),
    };
  }) ?? [];

  return {
    gameId: g.id,
    team1: g.home_team,
    team2: g.away_team,
    startTs: new Date(g.start_time).getTime() / 1000,
    isLive: !!g.is_live,
    sportId: g.sport_id,
    sportName: g.sport_name,
    regionName: g.region_name,
    competitionName: g.competition_name,
    markets,
  };
}

export async function restGetAllSports() {
  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: { sport: ['id', 'name', 'alias'] },
      where: {},
      ...SUB,
    },
  });
  return unwrapData(res);
}

/**
 * Finix `UpcomingByDay` uses `sport: { alias }`, `game: { '@and': [ type 0|2, start_ts ] }`, `market: { type @in MR }`.
 * Prefer `sportAlias` from the URL when present — some Swarm trees key off alias like finix, not numeric id.
 */
export async function restGetMatchesForSport(
  sportId: number,
  options?: { sportAlias?: string | null }
): Promise<GameView[]> {
  const sportWhere = options?.sportAlias
    ? { alias: String(options.sportAlias) }
    : { id: sportId };

  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: {
        sport: ['id', 'name', 'alias'],
        region: ['id', 'name', 'alias'],
        competition: ['id', 'name', 'order'],
        game: [
          'id',
          'team1_name',
          'team2_name',
          'team1_id',
          'team2_id',
          'start_ts',
          'markets_count',
          'is_blocked',
          'is_live',
          'promoted',
        ],
        market: ['name', 'type', 'id', 'base'],
        event: ['name', 'type', 'id', 'price', 'base'],
      },
      where: {
        sport: sportWhere,
        game: { '@and': [{ type: { '@in': [0, 2] } }] },
        market: { type: { '@in': MATCH_RESULT_TYPES } },
      },
      ...SUB,
    },
  });
  logSwarmResponse('restGetMatchesForSport → raw', res);
  const data = unwrapData(res);
  const tree = unwrapGameTreePayload(data);
  swarmLog('restGetMatchesForSport → unwrapped', summarizeSwarmData(data));
  const games = flattenGamesFromNestedSport(tree, 'matchesForSport');
  swarmLog('restGetMatchesForSport → flattened game rows', games.length);
  return games;
}

/** Same Swarm contract as finix `UpcomingByDay` (default sport Soccer, next 12h). */
export async function restGetUpcomingMatches(opts?: {
  sportAlias?: string;
  timeHours?: string | number;
}): Promise<GameView[]> {
  const sportAlias = opts?.sportAlias ?? 'Soccer';
  const lt = ltSecondsFromTimeHours(opts?.timeHours);
  const gameAnd: Array<Record<string, unknown>> = [{ type: { '@in': [0, 2] } }];
  if (lt != null && lt > 0) {
    gameAnd.push({ start_ts: { '@now': { '@gte': 0, '@lt': lt } } });
  }

  const params = {
    source: 'betting',
    what: {
      sport: ['id', 'name', 'alias'],
      region: ['id', 'name', 'alias'],
      competition: ['id', 'name', 'order'],
      game: [
        'id',
        'team1_name',
        'team2_name',
        'team1_id',
        'team2_id',
        'start_ts',
        'markets_count',
        'is_blocked',
        'is_live',
        'promoted',
      ],
      market: ['name', 'type', 'id', 'base'],
      event: ['name', 'type', 'id', 'price', 'base'],
    },
    where: {
      sport: { alias: sportAlias },
      game: { '@and': gameAnd },
      market: { type: { '@in': MATCH_RESULT_TYPES } },
    },
    ...SUB,
  };
  swarmLog('restGetUpcomingMatches → request', {
    sportAlias,
    timeHours: opts?.timeHours,
    ltSeconds: lt,
    where: params.where,
  });

  const res = await swarmPost({
    command: 'get',
    params,
  });
  logSwarmResponse('restGetUpcomingMatches → raw', res);
  const data = unwrapData(res);
  const tree = unwrapGameTreePayload(data);
  swarmLog('restGetUpcomingMatches → unwrapped', summarizeSwarmData(data));
  swarmLog('restGetUpcomingMatches → after subscription unwrap', summarizeSwarmData(tree));
  const games = flattenGamesFromNestedSport(tree, 'upcoming');
  swarmLog('restGetUpcomingMatches → flattened game rows', games.length);
  return games;
}

/**
 * Finix `PopularMatchesTable`: Soccer prematch fixtures in the next 48h with match-result markets,
 * excluding promoted games (those surface in “Top” / Featured instead).
 */
export async function restGetPopularSoccerMatches(): Promise<GameView[]> {
  const games = await restGetUpcomingMatches({ sportAlias: 'Soccer', timeHours: 48 });
  return games.filter((g) => !g.promoted);
}

function ltSecondsFromTimeHours(timeHours?: string | number): number | null {
  if (timeHours == null || timeHours === '12') {
    return 12 * 3600;
  }
  if (timeHours === '3' || timeHours === '6') {
    return Number(timeHours) * 3600;
  }
  if (String(timeHours).toLowerCase() === 'today') {
    const now = Math.floor(Date.now() / 1000);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor(end.getTime() / 1000) - now);
  }
  if (String(timeHours).toLowerCase() === 'tomorrow') {
    const now = Math.floor(Date.now() / 1000);
    const end = new Date();
    end.setDate(end.getDate() + 1);
    end.setHours(23, 59, 59, 999);
    return Math.max(0, Math.floor(end.getTime() / 1000) - now);
  }
  if (String(timeHours).toLowerCase() === 'weeks') {
    return 7 * 24 * 3600;
  }
  if (String(timeHours).toLowerCase() === 'all') {
    return null;
  }
  if (!Number.isNaN(Number(timeHours))) {
    return Number(timeHours) * 3600;
  }
  return 12 * 3600;
}

export async function restGetMatchOdds(gameId: number): Promise<MatchDetailView | null> {
  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: {
        sport: ['id', 'name'],
        region: ['id', 'name'],
        competition: ['id', 'name'],
        game: ['id', 'team1_name', 'team2_name', 'start_ts', 'is_live'],
        market: ['id', 'name', 'type', 'display_key', 'home_score', 'away_score'],
        event: ['id', 'name', 'price', 'type', 'base'],
      },
      where: {
        game: { id: gameId },
      },
      ...SUB,
    },
  });
  const data = unwrapData(res);
  const flat = nestedToFlatRows(unwrapGameTreePayload(data));
  return nestFromFlatRows(flat);
}

export async function restGetLiveGames(): Promise<GameView[]> {
  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: {
        sport: ['id', 'name', 'alias'],
        region: ['id', 'name'],
        competition: ['id', 'name'],
        game: ['id', 'team1_name', 'team2_name', 'start_ts', 'markets_count', 'is_blocked', 'is_live'],
      },
      where: {
        game: { type: 1, '@limit': 400 },
      },
      ...SUB,
    },
  });
  const data = unwrapData(res);
  return flattenGamesFromNestedSport(unwrapGameTreePayload(data), 'liveGames');
}

/** Finix `TopMatches` — promoted fixtures with P1/X/P2 markets. Optional `sportAlias` (e.g. `Soccer`). */
export async function restGetPromotedMatches(opts?: { sportAlias?: string }): Promise<GameView[]> {
  const where: Record<string, unknown> = {
    game: { promoted: true, '@limit': 200 },
    market: { type: { '@in': P1XP2_MARKET_TYPES } },
    event: { type: { '@in': ['P1', 'X', 'P2'] } },
  };
  if (opts?.sportAlias) {
    where.sport = { alias: String(opts.sportAlias) };
  }

  const res = await swarmPost({
    command: 'get',
    params: {
      source: 'betting',
      what: {
        sport: ['id', 'name', 'alias'],
        region: ['id', 'name', 'alias'],
        competition: ['id', 'name', 'order'],
        game: ['id', 'team1_name', 'team2_name', 'team1_id', 'team2_id', 'start_ts', 'is_blocked', 'markets_count'],
        market: ['name', 'type', 'id'],
        event: ['name', 'type', 'id', 'price'],
      },
      where,
      ...SUB,
    },
  });
  const data = unwrapData(res);
  return flattenGamesFromNestedSport(unwrapGameTreePayload(data), 'promoted');
}

type ParsedEvent = { id: number; name: string; price: number; type: string };

function parseGameEvents(evObj: Record<string, unknown>): ParsedEvent[] {
  return Object.values(evObj).map((e) => {
    const ev = e as Record<string, unknown>;
    return {
      id: Number(ev.id),
      name: String(ev.name ?? ''),
      price: Number(ev.price ?? ev.value ?? 0),
      type: String(ev.type ?? '').toUpperCase(),
    };
  });
}

function pickThreeWay(events: ParsedEvent[]): { home: ParsedEvent; draw: ParsedEvent; away: ParsedEvent } | null {
  if (events.length < 3) return null;
  const used = new Set<number>();
  const take = (pred: (e: ParsedEvent) => boolean) => {
    const e = events.find((x) => !used.has(x.id) && pred(x));
    if (e) used.add(e.id);
    return e;
  };
  const home =
    take((e) => ['P1', 'W1', '1'].includes(e.type)) ||
    take((e) => {
      const n = e.name.toLowerCase().trim();
      return n === '1' || n === 'home';
    });
  const draw =
    take((e) => ['X', 'D'].includes(e.type)) ||
    take((e) => {
      const n = e.name.toLowerCase().trim();
      return n === 'x' || n === 'draw';
    });
  const away =
    take((e) => ['P2', 'W2', '2'].includes(e.type)) ||
    take((e) => {
      const n = e.name.toLowerCase().trim();
      return n === '2' || n === 'away';
    });
  if (home && draw && away) {
    return { home, draw, away };
  }
  if (events.length === 3) {
    const e0 = events[0];
    const e1 = events[1];
    const e2 = events[2];
    if (e0 && e1 && e2) {
      return { home: e0, draw: e1, away: e2 };
    }
  }
  return null;
}

/**
 * Pick the first suitable 3-way market and map events to home / draw / away (P1/X/P2, 1/X/2, or order).
 */
function extractMatchResult1x2FromGame(g: Record<string, unknown>): MatchResult1x2Odds | undefined {
  const marketObj = (g.market as Record<string, unknown>) ?? {};
  const markets = Object.values(marketObj) as Record<string, unknown>[];
  const sorted = [...markets].sort((a, b) => {
    const at = String(a.type ?? '');
    const bt = String(b.type ?? '');
    return (MATCH_RESULT_TYPES.includes(at) ? 0 : 1) - (MATCH_RESULT_TYPES.includes(bt) ? 0 : 1);
  });

  for (const mk of sorted) {
    const evObj = (mk.event as Record<string, unknown>) ?? {};
    const events = parseGameEvents(evObj);
    const triple = pickThreeWay(events);
    if (!triple) continue;
    const { home, draw, away } = triple;
    if (![home, draw, away].every((e) => Number.isFinite(e.price) && e.price > 0 && Number.isFinite(e.id))) {
      continue;
    }

    return {
      marketId: Number(mk.id),
      marketName: String(mk.name ?? 'Match Result'),
      home: { eventId: home.id, price: home.price, name: home.name },
      draw: { eventId: draw.id, price: draw.price, name: draw.name },
      away: { eventId: away.id, price: away.price, name: away.name },
    };
  }
  return undefined;
}

function nestedToFlatRows(data: unknown): FlatGameRow[] {
  const rows: FlatGameRow[] = [];
  const payload = unwrapGameTreePayload(data);
  const root = payload as {
    sport?: Record<string, { region?: Record<string, { competition?: Record<string, { game?: Record<string, unknown> }> }> }>;
  };
  if (!root?.sport) return rows;
  for (const sp of Object.values(root.sport)) {
    const sportId = Number((sp as { id?: unknown }).id);
    const sportName = String((sp as { name?: unknown }).name ?? '');
    const spRec = sp as { region?: object; game?: object };
    const hasRegion =
      spRec.region != null &&
      typeof spRec.region === 'object' &&
      Object.keys(spRec.region).length > 0;
    if (!hasRegion && spRec.game) {
      for (const gm of Object.values(spRec.game)) {
        const g = gm as Record<string, unknown>;
        const marketObj = (g.market as Record<string, unknown>) ?? {};
        const markets = Object.values(marketObj).map((m) => {
          const mk = m as Record<string, unknown>;
          const evObj = (mk.event as Record<string, unknown>) ?? {};
          const odds = Object.values(evObj).map((e) => {
            const ev = e as Record<string, unknown>;
            return {
              id: ev.id,
              name: ev.name,
              value: ev.price,
            };
          });
          return {
            id: mk.id,
            name: mk.name,
            type: mk.type,
            display_key: mk.display_key,
            base: mk.base,
            odds,
          };
        });
        rows.push({
          id: Number(g.id),
          sport_id: sportId,
          sport_name: sportName,
          region_id: 0,
          region_name: '',
          competition_id: 0,
          competition_name: '',
          home_team: String(g.team1_name ?? ''),
          away_team: String(g.team2_name ?? ''),
          start_time: new Date(Number(g.start_ts) * 1000).toISOString(),
          is_live: !!g.is_live,
          is_blocked: !!g.is_blocked,
          markets: markets as unknown[],
          home_score: undefined,
          away_score: undefined,
        });
      }
      continue;
    }
    for (const reg of Object.values(spRec.region ?? {})) {
      const regionId = Number((reg as { id?: unknown }).id);
      const regionName = String((reg as { name?: unknown }).name ?? '');
      for (const comp of Object.values((reg as { competition?: object }).competition ?? {})) {
        const competitionId = Number((comp as { id?: unknown }).id);
        const competitionName = String((comp as { name?: unknown }).name ?? '');
        for (const gm of Object.values((comp as { game?: object }).game ?? {})) {
          const g = gm as Record<string, unknown>;
          const marketObj = (g.market as Record<string, unknown>) ?? {};
          const markets = Object.values(marketObj).map((m) => {
            const mk = m as Record<string, unknown>;
            const evObj = (mk.event as Record<string, unknown>) ?? {};
            const odds = Object.values(evObj).map((e) => {
              const ev = e as Record<string, unknown>;
              return {
                id: ev.id,
                name: ev.name,
                value: ev.price,
              };
            });
            return {
              id: mk.id,
              name: mk.name,
              type: mk.type,
              display_key: mk.display_key,
              base: mk.base,
              odds,
            };
          });
          rows.push({
            id: Number(g.id),
            sport_id: sportId,
            sport_name: sportName,
            region_id: regionId,
            region_name: regionName,
            competition_id: competitionId,
            competition_name: competitionName,
            home_team: String(g.team1_name ?? ''),
            away_team: String(g.team2_name ?? ''),
            start_time: new Date(Number(g.start_ts) * 1000).toISOString(),
            is_live: !!g.is_live,
            is_blocked: !!g.is_blocked,
            markets: markets as unknown[],
            home_score: undefined,
            away_score: undefined,
          });
        }
      }
    }
  }
  return rows;
}

function flattenGamesFromNestedSport(data: unknown, debugTag = 'flatten'): GameView[] {
  const rows: GameView[] = [];
  const payload = unwrapGameTreePayload(data);
  const root = payload as {
    sport?: Record<string, { region?: object; game?: object; id?: unknown; name?: unknown }>;
  };
  if (!root?.sport) {
    swarmLog(`${debugTag}: no data.sport — cannot list games`, {
      beforeUnwrap: summarizeSwarmData(data),
      afterUnwrap: summarizeSwarmData(payload),
    });
    return rows;
  }
  let fromFlat = 0;
  let fromRegion = 0;
  for (const sp of Object.values(root.sport)) {
    const sportId = Number(sp.id);
    const sportName = String(sp.name ?? '');
    const hasRegion =
      sp.region != null && typeof sp.region === 'object' && Object.keys(sp.region).length > 0;
    if (!hasRegion && sp.game) {
      for (const gm of Object.values(sp.game)) {
        const g = gm as Record<string, unknown>;
        fromFlat += 1;
        rows.push({
          id: Number(g.id),
          team1: String(g.team1_name ?? ''),
          team2: String(g.team2_name ?? ''),
          team1Id: pickTeamIdFromGame(g, 1),
          team2Id: pickTeamIdFromGame(g, 2),
          startTs: Number(g.start_ts),
          isLive: !!g.is_live,
          isBlocked: !!g.is_blocked,
          sportId,
          sportName,
          regionName: '',
          competitionName: '',
          marketsCount: Number(g.markets_count ?? 0),
          promoted: !!g.promoted,
          matchResult1x2: extractMatchResult1x2FromGame(g),
        });
      }
      continue;
    }
    for (const reg of Object.values((sp.region as object) ?? {})) {
      const regionName = String((reg as { name?: unknown }).name ?? '');
      for (const comp of Object.values((reg as { competition?: object }).competition ?? {})) {
        const competitionName = String((comp as { name?: unknown }).name ?? '');
        for (const gm of Object.values((comp as { game?: object }).game ?? {})) {
          const g = gm as Record<string, unknown>;
          fromRegion += 1;
          rows.push({
            id: Number(g.id),
            team1: String(g.team1_name ?? ''),
            team2: String(g.team2_name ?? ''),
            team1Id: pickTeamIdFromGame(g, 1),
            team2Id: pickTeamIdFromGame(g, 2),
            startTs: Number(g.start_ts),
            isLive: !!g.is_live,
            isBlocked: !!g.is_blocked,
            sportId,
            sportName,
            regionName,
            competitionName,
            marketsCount: Number(g.markets_count ?? 0),
            promoted: !!g.promoted,
            matchResult1x2: extractMatchResult1x2FromGame(g),
          });
        }
      }
    }
  }
  swarmLog(`${debugTag}: walk complete`, {
    sportBuckets: Object.keys(root.sport).length,
    rowsFromFlatSportGame: fromFlat,
    rowsFromRegionTree: fromRegion,
    totalRows: fromFlat + fromRegion,
  });
  return rows.sort((a, b) => a.startTs - b.startTs);
}
