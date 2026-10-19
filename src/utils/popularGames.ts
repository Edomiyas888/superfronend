import type { GameView } from '../api/types';
import { isSpecialOrVirtualFixture } from './specialFixtureFilter';

function dayKeyLocal(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysToDayKey(dayKey: string, days: number): string {
  const parts = dayKey.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  const d = parts[2] ?? 1;
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return dayKeyLocal(Math.floor(date.getTime() / 1000));
}

/** Today plus the next two calendar days (3-day window). */
export const POPULAR_DAY_WINDOW = 3;

/**
 * Popular home list: every real fixture of the chosen league from today through the day window,
 * in kickoff order. The header promises "next N days", so nothing inside the window is dropped.
 * Excludes Swarm stats / mythical / aggregate markets.
 */
export function curatePopularGames(games: GameView[], dayWindow = POPULAR_DAY_WINDOW): GameView[] {
  const todayKey = dayKeyLocal(Math.floor(Date.now() / 1000));
  const maxDayKey = addDaysToDayKey(todayKey, dayWindow - 1);
  return games
    .filter((g) => !isSpecialOrVirtualFixture(g))
    .filter((g) => {
      const dk = dayKeyLocal(g.startTs);
      return dk >= todayKey && dk <= maxDayKey;
    })
    .sort((a, b) => a.startTs - b.startTs);
}
