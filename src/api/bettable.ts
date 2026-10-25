import type { GameView, MarketView } from './types';

/** Lowest price shown as a real selection: anything under it displays as 1.00 and is closed. */
const MIN_OPEN_PRICE = 1.01;

export function isOpenPrice(price: number): boolean {
  return Number.isFinite(price) && price >= MIN_OPEN_PRICE;
}

/**
 * Lists only show what can still be bet on. A pre-match fixture is gone once it kicks off
 * (unless it turns live) or when the operator blocks it. A live match that is suspended
 * stays listed — it reopens in seconds — but without odds, so its row shows the padlocks.
 */
export function keepBettableGames(games: GameView[], nowSec = Date.now() / 1000): GameView[] {
  return games.flatMap((g) => {
    if (!g.isLive) {
      if (g.isBlocked || (Number.isFinite(g.startTs) && g.startTs <= nowSec)) return [];
      return [g];
    }
    return g.isBlocked ? [{ ...g, matchResult1x2: undefined }] : [g];
  });
}

/** A selection without an open price is closed; a market with none open is closed. */
export function keepOpenMarkets(markets: MarketView[]): MarketView[] {
  return markets
    .map((m) => ({ ...m, events: m.events.filter((e) => isOpenPrice(e.price)) }))
    .filter((m) => m.events.length > 0);
}

/** Why a match page cannot take bets right now, or `null` when it can. */
export function matchClosedReason(
  detail: { isLive: boolean; isBlocked?: boolean; startTs: number },
  nowSec = Date.now() / 1000
): 'suspended' | 'closed' | null {
  if (!detail.isLive && Number.isFinite(detail.startTs) && detail.startTs <= nowSec) return 'closed';
  if (detail.isBlocked) return 'suspended';
  return null;
}
