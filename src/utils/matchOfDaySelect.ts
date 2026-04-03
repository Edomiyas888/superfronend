import type { GameView } from '../api/types';

function isSoccer(g: GameView): boolean {
  const a = g.sportName.trim().toLowerCase();
  return a === 'soccer' || a === 'football';
}

/**
 * Prefer today’s promoted Soccer fixtures (local calendar); if none, use upcoming order.
 * Mirrors finixbet `matchoftheday.jsx` today filter + carousel cap.
 */
export function selectMatchOfTheDayGames(games: GameView[]): GameView[] {
  const soccerOnly = games.filter(isSoccer);
  const sorted = [...soccerOnly].sort((a, b) => a.startTs - b.startTs);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const todayEnd = todayStart + 86400;
  const todayOnly = sorted.filter((g) => g.startTs >= todayStart && g.startTs < todayEnd);
  const pool = todayOnly.length > 0 ? todayOnly : sorted;
  return pool.slice(0, 50);
}
