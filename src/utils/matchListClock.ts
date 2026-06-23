import type { GameView } from '../api/types';
import { extractLiveClockOnly, extractPrimaryScoreFromLiveText } from './liveGameDisplay';
import { formatKickoffTime } from './matchDayGrouping';

function liveTextHasScore(raw: string): boolean {
  return /\d+\s*[:\-–]\s*\d+/.test(raw);
}

/** Clock / time shown in list rows: live `MM:SS` when feed provides it, else kickoff time. */
export function formatMatchListClock(g: GameView, liveContext: boolean): string {
  const live = liveContext || g.isLive;
  if (live) {
    const raw = g.liveMatchTime?.trim();
    if (raw) {
      const hasStructuredScore = g.homeScore != null && g.awayScore != null;
      const stripScores = hasStructuredScore || liveTextHasScore(raw);
      const clockText = stripScores ? extractLiveClockOnly(raw) : raw;
      const normalized = (clockText || (stripScores ? 'Live' : raw)).trim();
      if (/^\d{1,3}:\d{2}$/.test(normalized)) return normalized;
      if (/^\d{1,3}:\d{2}:\d{2}$/.test(normalized)) {
        const parts = normalized.split(':');
        if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined) {
          const h = parts[0].padStart(2, '0');
          return `${h}:${parts[1]}`;
        }
      }
      if (normalized) return normalized;
    }
    return 'Live';
  }
  return formatKickoffTime(g.startTs);
}

/** MOTD live block: one score + clock (no duplicate period scores from feed text). */
export function formatMotdLiveDisplay(g: GameView): {
  showScore: boolean;
  home: number;
  away: number;
  clock: string;
} {
  const raw = g.liveMatchTime?.trim() ?? '';
  const hasStructured = g.homeScore != null && g.awayScore != null;

  if (hasStructured) {
    const clock = raw ? extractLiveClockOnly(raw) : '';
    return {
      showScore: true,
      home: g.homeScore!,
      away: g.awayScore!,
      clock: clock || 'In play',
    };
  }

  const parsed = raw ? extractPrimaryScoreFromLiveText(raw) : null;
  if (parsed) {
    const clock = extractLiveClockOnly(raw);
    return {
      showScore: true,
      home: parsed.home,
      away: parsed.away,
      clock: clock || 'In play',
    };
  }

  return {
    showScore: false,
    home: 0,
    away: 0,
    clock: raw || 'In play',
  };
}
