import type { GameView } from '../api/types';
import { formatKickoffTime } from './matchDayGrouping';

/** Clock / time shown in list rows: live `MM:SS` when feed provides it, else kickoff time. */
export function formatMatchListClock(g: GameView, liveContext: boolean): string {
  const live = liveContext || g.isLive;
  if (live) {
    const raw = g.liveMatchTime?.trim();
    if (raw) {
      if (/^\d{1,3}:\d{2}$/.test(raw)) return raw;
      if (/^\d{1,3}:\d{2}:\d{2}$/.test(raw)) {
        const parts = raw.split(':');
        if (parts.length === 3 && parts[0] !== undefined && parts[1] !== undefined) {
          const h = parts[0].padStart(2, '0');
          return `${h}:${parts[1]}`;
        }
      }
      return raw;
    }
    return 'Live';
  }
  return formatKickoffTime(g.startTs);
}
