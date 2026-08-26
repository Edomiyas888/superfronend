import { MATCH_RESULT_TYPES } from '../../api/marketConstants';
import type { MarketView } from '../../api/types';

export type TopMarketKind = 'match-result' | 'double-chance' | 'btts';

/** Promoted markets on match detail, in display order. */
export const TOP_MARKET_ORDER: TopMarketKind[] = ['match-result', 'double-chance', 'btts'];

const HALF_OR_PERIOD =
  /1st half|2nd half|first half|second half|half time|halftime|\bhalves\b|period \d|\bquarter\b|\bset \d|\binning|\d+\s*-\s*\d+\s*min|\bmin\.|\bminute/i;

const DOUBLE_CHANCE_TYPES = ['DoubleChance'];
const BTTS_TYPES = ['BothTeamsToScore', 'TeamToScore', 'BothTeamsScore'];

function marketText(m: MarketView): string {
  return `${m.name} ${m.displayKey ?? ''}`.toLowerCase();
}

function normKey(m: MarketView): string {
  return (m.displayKey ?? '').trim().toUpperCase();
}

/**
 * Swarm's `display_key` is a far better signal than the market name — it buckets markets the way
 * the operator's own front end does. It does not distinguish full-match from period markets
 * though, so scope is scored separately (see `marketImportanceRank`).
 */
const KIND_RANK_BY_DISPLAY_KEY: Record<string, number> = {
  WINNER: 0,
  'DOUBLE CHANCE': 1,
  BOTHTEAMTOSCORE: 2,
  TOTALS: 3,
  HANDICAP: 4,
  HANDICAP3WAY: 4,
  'CORRECT SCORE': 5,
  TEAM_TOTALS: 6,
  'HALFTIME/FULLTIME': 7,
  'FIRST GOAL': 8,
  'LAST GOAL': 8,
  'ODD/EVEN': 9,
  HOMETOSCORE: 10,
  AWAYTOSCORE: 10,
  HALFWITHMOSTGOALS: 11,
  HOMEWINATLEASTHALF: 11,
  AWAYWINATLEASTHALF: 11,
  WINNER_EP: 12,
  WINNER_UP: 12,
  CORNERWINNER: 14,
  CORNERTOTALS: 14,
  CORNERHANDICAP: 14,
  'CORNERODD/EVEN': 14,
};

/** Name-based fallback for the ~80% of markets Swarm ships without a `display_key`. */
const KIND_RANK_BY_NAME: { rank: number; test: RegExp }[] = [
  { rank: 0, test: /^(match|full time|regular time)? ?result$|^1x2$|^match winner$|^match odds$/ },
  { rank: 1, test: /^double chance$/ },
  { rank: 2, test: /^both teams to score$/ },
  { rank: 3, test: /^total goals?$|^over\/under$|^goals over\/under$/ },
  { rank: 4, test: /^draw no bet$|^(goals )?(asian )?handicap$/ },
  { rank: 5, test: /^correct score$/ },
  { rank: 20, test: /scorer|goalscorer|anytime|any time|player to score|player props/ },
  { rank: 22, test: /corner/ },
  { rank: 24, test: /booking|card\b|cards\b|yellow|red card|sending off/ },
];

/** Combination / exotic markets borrow headline keywords but are not headline markets. */
const COMBINATION = /\band\b|\bcombo\b|\bcombination\b|\bmix\b|\bmulti\b|:|\bvs\b/i;

/** Same bet, alternate line or payout rule — keep just below the plain version. */
const VARIANT = /\basian\b|early payout|\b1up\b|\bexact\b|\bbands\b|3 way|2 or more|\bor more\b/i;

const PERIOD_PENALTY = 30;
const VARIANT_PENALTY = 1;
const UNRANKED = 90;

function kindRank(m: MarketView): number {
  const byKey = KIND_RANK_BY_DISPLAY_KEY[normKey(m)];
  if (byKey !== undefined) return byKey;

  const name = m.name.trim().toLowerCase();
  // A combination market never qualifies for a headline slot on its keywords alone.
  if (COMBINATION.test(name)) return UNRANKED;
  for (const { rank, test } of KIND_RANK_BY_NAME) {
    if (test.test(name)) return rank;
  }
  if (MATCH_RESULT_TYPES.includes(String(m.type ?? ''))) return 0;
  return UNRANKED;
}

/**
 * Importance rank for the markets list — lower sorts first. Swarm returns markets in a broadly
 * arbitrary order, so the headline bets (match result, double chance, BTTS, totals…) are pulled to
 * the top, period-scoped and exotic variants pushed below them.
 */
export function marketImportanceRank(m: MarketView): number {
  const base = kindRank(m);
  if (base >= UNRANKED) return UNRANKED;

  const name = m.name;
  let rank = base;
  if (HALF_OR_PERIOD.test(name)) rank += PERIOD_PENALTY;
  if (VARIANT.test(name)) rank += VARIANT_PENALTY;
  if (COMBINATION.test(name)) rank += PERIOD_PENALTY;
  return rank;
}

/**
 * Stable sort by importance. Markets of equal importance keep the order the API returned them in,
 * except that the repeated lines of one market (Total Goals 0.5, 1, 1.5 …) are ordered numerically.
 */
export function sortMarketsByImportance(markets: MarketView[]): MarketView[] {
  const firstIndexByName = new Map<string, number>();
  markets.forEach((m, i) => {
    const name = m.name.trim().toLowerCase();
    if (!firstIndexByName.has(name)) firstIndexByName.set(name, i);
  });

  return markets
    .map((m, i) => ({
      m,
      i,
      rank: marketImportanceRank(m),
      group: firstIndexByName.get(m.name.trim().toLowerCase()) ?? i,
      line: m.base ?? Number.NEGATIVE_INFINITY,
    }))
    .sort(
      (a, b) => a.rank - b.rank || a.group - b.group || a.line - b.line || a.i - b.i
    )
    .map(({ m }) => m);
}

export function classifyTopMarket(m: MarketView): TopMarketKind | null {
  const n = marketText(m);
  const key = normKey(m);
  const type = String(m.type ?? '');

  // Period-scoped and combination markets never belong in a hero slot.
  if (HALF_OR_PERIOD.test(m.name) || COMBINATION.test(m.name)) return null;

  if (key === 'BOTHTEAMTOSCORE' || /both teams to score|\bbtts\b/.test(n) || BTTS_TYPES.includes(type)) {
    return 'btts';
  }
  if (key === 'DOUBLE CHANCE' || /double chance/.test(n) || DOUBLE_CHANCE_TYPES.includes(type)) {
    return 'double-chance';
  }
  if (key === 'WINNER') return 'match-result';
  if (key) return null;
  if (MATCH_RESULT_TYPES.includes(type)) return 'match-result';
  if (
    /match result|full time result|regular time result|\b1x2\b|three.?way result|3.?way result|match winner|match odds/.test(
      n
    )
  ) {
    return 'match-result';
  }

  return null;
}

/** Best (most important, least exotic) market for each top slot, in fixed order. */
export function pickTopMarkets(markets: MarketView[]): MarketView[] {
  const byKind = new Map<TopMarketKind, { market: MarketView; rank: number }>();
  for (const m of markets) {
    const kind = classifyTopMarket(m);
    if (!kind) continue;
    const rank = marketImportanceRank(m);
    const current = byKind.get(kind);
    if (!current || rank < current.rank) {
      byKind.set(kind, { market: m, rank });
    }
  }
  return TOP_MARKET_ORDER.map((kind) => byKind.get(kind)?.market).filter(
    (m): m is MarketView => !!m
  );
}

function formatLine(base: number): string {
  return String(base);
}

/** True when the name already carries the line as its own token ("Total Goals 2.5"). */
function nameHasLine(name: string, line: string): boolean {
  const escaped = line.replace(/[-.+]/g, (c) => `\\${c}`);
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`).test(name);
}

function isHandicapMarket(m: MarketView): boolean {
  return /HANDICAP/.test(normKey(m)) || /handicap/i.test(String(m.type ?? ''));
}

/** Handicap lines read as "+1" / "-1"; totals lines are unsigned. */
function lineLabel(m: MarketView, base: number): string {
  const line = formatLine(base);
  return isHandicapMarket(m) && base > 0 ? `+${line}` : line;
}

/**
 * Swarm ships one market per line (Total Goals 0.5, 1.5, 2.5 …) all under the same `name`, with
 * the line only in `base`. Without it the list shows a dozen identical-looking accordions.
 */
export function marketDisplayName(m: MarketView): string {
  const name = m.name.trim();
  if (m.base == null) return name;
  const line = lineLabel(m, m.base);
  return nameHasLine(name, line) ? name : `${name} ${line}`;
}

/** Selection label with its line — Swarm names these just "Over" / "Under" / the team. */
export function selectionLabel(m: MarketView, event: { name: string; base?: number }): string {
  const name = event.name.trim();
  const base = event.base ?? m.base;
  if (base == null) return name;
  const line = lineLabel(m, base);
  return nameHasLine(name, line) ? name : `${name} ${line}`;
}

/** Match a market against a free-text query — name, display key, line and selection names. */
export function marketMatchesSearch(m: MarketView, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    m.name,
    m.displayKey ?? '',
    m.base != null ? lineLabel(m, m.base) : '',
    ...m.events.map((e) => selectionLabel(m, e)),
  ]
    .join(' ')
    .toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}
