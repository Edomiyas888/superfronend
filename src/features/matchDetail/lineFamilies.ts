import type { MarketView } from '../../api/types';
import { marketDisplayName } from './topMarkets';

/**
 * One card in the markets list. Swarm ships one market per line (Total Goals 0.5, 1, 1.5 …), so a
 * fixture's ~400 markets are really ~250 bets; a card stacks every line of one bet.
 */
export type MarketCard = {
  /** Stable across refetches, so expanded state survives the 15s odds poll. */
  key: string;
  title: string;
  /** One entry per line, in line order; a single entry for a plain market. */
  markets: MarketView[];
};

/**
 * Fold the lines of each market into one card. Expects the list already sorted
 * (`sortMarketsByImportance` keeps a family's lines adjacent and in line order); cards keep the
 * position of their first line.
 */
export function groupLineFamilies(markets: MarketView[]): MarketCard[] {
  const cards: MarketCard[] = [];
  const byKey = new Map<string, MarketCard>();
  for (const m of markets) {
    if (m.base == null) {
      cards.push({ key: `m:${m.id}`, title: marketDisplayName(m), markets: [m] });
      continue;
    }
    const key = `f:${m.name.trim().toLowerCase()}|${String(m.type ?? '')}`;
    const card = byKey.get(key);
    if (card) {
      card.markets.push(m);
      continue;
    }
    const created: MarketCard = { key, title: m.name.trim(), markets: [m] };
    byKey.set(key, created);
    cards.push(created);
  }
  // A family that came back with a single line reads better with the line in its title.
  for (const card of cards) {
    const only = card.markets[0];
    if (card.markets.length === 1 && only) card.title = marketDisplayName(only);
  }
  return cards;
}
