import type { MatchDetailView } from '../api/types';
import {
  extractLiveClockOnly,
  formatLiveMatchTimeText,
  liveDisplayFieldsFromRawGame,
} from './liveGameDisplay';

export type LiveGameDisplay = {
  isLive: boolean;
  homeScore?: number;
  awayScore?: number;
  liveMatchTime?: string;
};

export function liveDisplayFromMatchDetail(detail: MatchDetailView): LiveGameDisplay {
  let homeScore: number | undefined;
  let awayScore: number | undefined;
  for (const m of detail.markets) {
    if (m.homeScore != null && m.awayScore != null) {
      homeScore = m.homeScore;
      awayScore = m.awayScore;
      break;
    }
  }

  const rawG: Record<string, unknown> = {
    text_info: detail.live?.textInfo ?? '',
    info: detail.live?.info,
    market: Object.fromEntries(
      detail.markets.map((m) => [String(m.id), { home_score: m.homeScore, away_score: m.awayScore }])
    ),
  };
  const fields = liveDisplayFieldsFromRawGame(rawG);
  homeScore = homeScore ?? fields.homeScore;
  awayScore = awayScore ?? fields.awayScore;

  const now = Math.floor(Date.now() / 1000);
  const kickoffPassed = detail.startTs > 0 && now >= detail.startTs;
  const hasScore = homeScore != null && awayScore != null;
  const hasClock = Boolean(fields.liveMatchTime?.trim() || detail.live?.textInfo?.trim());
  const isLive =
    detail.isLive ||
    (kickoffPassed && (hasScore || hasClock || detail.live != null));

  if (!isLive) {
    return { isLive: false };
  }

  return {
    isLive: true,
    homeScore,
    awayScore,
    liveMatchTime: fields.liveMatchTime ?? (detail.live?.textInfo?.trim() || undefined),
  };
}

export function formatLiveScoreTimeLine(display: LiveGameDisplay | undefined | null): string | null {
  if (!display?.isLive) return null;

  const parts: string[] = [];
  if (display.homeScore != null && display.awayScore != null) {
    parts.push(`${display.homeScore} - ${display.awayScore}`);
  }

  const rawClock = display.liveMatchTime?.trim();
  if (rawClock) {
    const clock =
      display.homeScore != null && display.awayScore != null
        ? extractLiveClockOnly(rawClock)
        : rawClock;
    if (clock) parts.push(clock);
  }

  if (parts.length === 0) return 'Live';
  return parts.join(' · ');
}

/** Build live line from a raw Swarm game node (my-bets score fetch). */
export function liveDisplayFromSwarmGame(g: Record<string, unknown>, isLive: boolean): LiveGameDisplay {
  if (!isLive) return { isLive: false };

  const fields = liveDisplayFieldsFromRawGame(g);
  const liveMatchTime = formatLiveMatchTimeText(g) || fields.liveMatchTime;

  return {
    isLive: true,
    homeScore: fields.homeScore,
    awayScore: fields.awayScore,
    liveMatchTime: liveMatchTime || undefined,
  };
}
