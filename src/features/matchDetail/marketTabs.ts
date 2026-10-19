import type { MarketView } from '../../api/types';
import { MARKET_FILTER_LABELS, MARKET_FILTER_ORDER, marketCategory } from './marketCategory';

export const ALL_TAB = 'All';

/**
 * Tab a market belongs to. Swarm's `group_name` is the operator's own grouping (Match, Totals,
 * Handicaps, Halves, Combos, Players …) and is far more reliable than guessing from the name, which
 * remains the fallback for feeds that omit it.
 */
export function marketTab(m: MarketView): string {
  return m.groupName ?? MARKET_FILTER_LABELS[marketCategory(m)];
}

/**
 * Tabs present in this fixture, in Swarm's order (by the first market in each group); name-guessed
 * tabs follow in their fixed order.
 */
export function marketTabs(markets: MarketView[]): string[] {
  const firstOrder = new Map<string, number>();
  for (const m of markets) {
    const tab = marketTab(m);
    // Name-guessed tabs sort after every Swarm group, in MARKET_FILTER_ORDER.
    const fallback = MARKET_FILTER_ORDER.findIndex(
      (c) => c !== 'all' && MARKET_FILTER_LABELS[c] === tab
    );
    const pos = m.groupName != null && m.order != null ? m.order : Number.MAX_SAFE_INTEGER - 100 + fallback;
    const current = firstOrder.get(tab);
    if (current === undefined || pos < current) firstOrder.set(tab, pos);
  }
  return [...firstOrder.entries()].sort((a, b) => a[1] - b[1]).map(([tab]) => tab);
}
