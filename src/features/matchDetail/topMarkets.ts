import { MATCH_RESULT_TYPES } from '../../api/marketConstants';
import type { MarketView } from '../../api/types';

export type TopMarketKind = 'match-result' | 'double-chance' | 'btts';

/** Promoted markets on match detail, in display order. */
export const TOP_MARKET_ORDER: TopMarketKind[] = ['match-result', 'double-chance', 'btts'];

const HALF_OR_PERIOD = /1st half|2nd half|first half|second half|half time|halftime|period \d/i;

const DOUBLE_CHANCE_TYPES = ['DoubleChance'];
const BTTS_TYPES = ['BothTeamsToScore', 'TeamToScore', 'BothTeamsScore'];

function marketText(m: MarketView): string {
  return `${m.name} ${m.displayKey ?? ''}`.toLowerCase();
}

export function classifyTopMarket(m: MarketView): TopMarketKind | null {
  const n = marketText(m);
  const type = String(m.type ?? '');

  if (/both teams to score|\bbtts\b/.test(n) || BTTS_TYPES.includes(type)) {
    return 'btts';
  }
  if (/double chance/.test(n) || DOUBLE_CHANCE_TYPES.includes(type)) {
    return 'double-chance';
  }
  if (HALF_OR_PERIOD.test(n)) return null;
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

/** First matching market for each top slot, in fixed order. */
export function pickTopMarkets(markets: MarketView[]): MarketView[] {
  const byKind = new Map<TopMarketKind, MarketView>();
  for (const m of markets) {
    const kind = classifyTopMarket(m);
    if (!kind || byKind.has(kind)) continue;
    byKind.set(kind, m);
  }
  return TOP_MARKET_ORDER.map((kind) => byKind.get(kind)).filter((m): m is MarketView => !!m);
}
