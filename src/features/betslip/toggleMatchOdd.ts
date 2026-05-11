import type { BetslipEventLike } from '../../api/placeBet';
import type { DoubleChanceOdds, GameView, MatchResult1x2Odds } from '../../api/types';
import { keyFor, useBetslipStore } from './betslipStore';

export function toggleMatchOdd(
  g: GameView,
  mr: MatchResult1x2Odds,
  leg: 'home' | 'draw' | 'away',
  addSelection: (k: string, ev: BetslipEventLike) => void,
  removeSelection: (k: string) => void,
  events: Record<string, BetslipEventLike>
): void {
  const pick = leg === 'home' ? mr.home : leg === 'draw' ? mr.draw : mr.away;
  const k = keyFor(g.id, mr.marketId, pick.eventId);
  if (events[k]) {
    removeSelection(k);
    return;
  }
  useBetslipStore.getState().removeSelectionsForGameMarket(g.id, mr.marketId);
  const ev: BetslipEventLike = {
    eventId: pick.eventId,
    gameId: g.id,
    marketName: mr.marketName,
    marketType: mr.marketName,
    teamone: g.team1,
    teamtwo: g.team2,
    region: g.regionName,
    competitionName: g.competitionName,
    title: `${g.team1} v ${g.team2}`,
    pick: pick.name || (leg === 'home' ? '1' : leg === 'draw' ? 'X' : '2'),
    price: pick.price,
    isLive: g.isLive,
    dateofmatch: Math.floor(g.startTs),
  };
  addSelection(k, ev);
}

export function toggleDoubleChanceOdd(
  g: GameView,
  dc: DoubleChanceOdds,
  leg: 'homeOrDraw' | 'homeOrAway' | 'drawOrAway',
  addSelection: (k: string, ev: BetslipEventLike) => void,
  removeSelection: (k: string) => void,
  events: Record<string, BetslipEventLike>
): void {
  const cell = leg === 'homeOrDraw' ? dc.homeOrDraw : leg === 'homeOrAway' ? dc.homeOrAway : dc.drawOrAway;
  const label = leg === 'homeOrDraw' ? '1X' : leg === 'homeOrAway' ? '12' : '2X';
  const k = keyFor(g.id, dc.marketId, cell.eventId);
  if (events[k]) {
    removeSelection(k);
    return;
  }
  useBetslipStore.getState().removeSelectionsForGameMarket(g.id, dc.marketId);
  const ev: BetslipEventLike = {
    eventId: cell.eventId,
    gameId: g.id,
    marketName: dc.marketName,
    marketType: dc.marketName,
    teamone: g.team1,
    teamtwo: g.team2,
    region: g.regionName,
    competitionName: g.competitionName,
    title: `${g.team1} v ${g.team2}`,
    pick: cell.name?.trim() || label,
    price: cell.price,
    isLive: g.isLive,
    dateofmatch: Math.floor(g.startTs),
  };
  addSelection(k, ev);
}
