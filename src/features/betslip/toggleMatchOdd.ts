import type { BetslipEventLike } from '../../api/placeBet';
import type { GameView, MatchResult1x2Odds } from '../../api/types';
import { keyFor, useBetslipStore } from './betslipStore';

export function toggleMatchOdd(
  g: GameView,
  mr: MatchResult1x2Odds,
  leg: 'home' | 'draw' | 'away',
  addSelection: (k: string, ev: BetslipEventLike) => boolean,
  removeSelection: (k: string) => void,
  events: Record<string, BetslipEventLike>
): void {
  const pick = leg === 'home' ? mr.home : leg === 'draw' ? mr.draw : mr.away;
  const k = keyFor(g.id, mr.marketId, pick.eventId);
  if (events[k]) {
    removeSelection(k);
    return;
  }
  useBetslipStore.getState().removeSelectionsForGame(g.id);
  const ev: BetslipEventLike = {
    eventId: pick.eventId,
    gameId: g.id,
    marketId: mr.marketId,
    marketName: mr.marketName,
    marketType: mr.marketType,
    eventType: pick.type,
    teamone: g.team1,
    teamtwo: g.team2,
    region: g.regionName,
    competitionName: g.competitionName,
    title: `${g.team1} v ${g.team2}`,
    pick: pick.name || (leg === 'home' ? '1' : leg === 'draw' ? 'X' : '2'),
    price: pick.price,
    initialPrice: pick.price,
    isLive: g.isLive,
    dateofmatch: Math.floor(g.startTs),
  };
  addSelection(k, ev);
}
