import type { GameView } from '../api/types';

function isSoccer(g: GameView): boolean {
  const a = g.sportName.trim().toLowerCase();
  return a === 'soccer' || a === 'football';
}

/**
 * Promoted Soccer fixtures for “Match of the Day” carousel: today’s pool if any, else upcoming.
 * Prefers promoted fixtures first, then kickoff time. Capped for the swiper.
 */
export function selectMatchOfTheDayGames(games: GameView[]): GameView[] {
  const soccerOnly = games.filter(isSoccer);
  const sorted = [...soccerOnly].sort((a, b) => {
    const ap = a.promoted ? 1 : 0;
    const bp = b.promoted ? 1 : 0;
    if (bp !== ap) return bp - ap;
    return a.startTs - b.startTs;
  });
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
  const todayEnd = todayStart + 86400;
  const todayOnly = sorted.filter((g) => g.startTs >= todayStart && g.startTs < todayEnd);
  const pool = todayOnly.length > 0 ? todayOnly : sorted;
  return pool.slice(0, 50);
}
