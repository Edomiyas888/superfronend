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
 * Popular home list: one real fixture from today (if any), then upcoming real matches
 * within the next 3 days. Excludes Swarm stats / mythical / aggregate markets.
 */
export function curatePopularGames(games: GameView[], maxGames = 16): GameView[] {
  const actual = games.filter((g) => !isSpecialOrVirtualFixture(g)).sort((a, b) => a.startTs - b.startTs);
  const todayKey = dayKeyLocal(Math.floor(Date.now() / 1000));
  const maxDayKey = addDaysToDayKey(todayKey, POPULAR_DAY_WINDOW - 1);

  let todayPick: GameView | undefined;
  const upcoming: GameView[] = [];

  for (const g of actual) {
    const dk = dayKeyLocal(g.startTs);
    if (dk < todayKey || dk > maxDayKey) continue;
    if (dk === todayKey) {
      if (!todayPick) todayPick = g;
    } else {
      upcoming.push(g);
    }
  }

  const result: GameView[] = [];
  if (todayPick) result.push(todayPick);
  for (const g of upcoming) {
    if (result.length >= maxGames) break;
    result.push(g);
  }
  return result;
}
