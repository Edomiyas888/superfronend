import type { GameView } from '../api/types';

function dayKeyLocal(ts: number): string {
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** e.g. "Sat 04 Apr" */
export function formatDayHeader(ts: number): string {
  const d = new Date(ts * 1000);
  const w = d.toLocaleDateString('en-GB', { weekday: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const mon = d.toLocaleDateString('en-GB', { month: 'short' });
  return `${w} ${day} ${mon}`;
}

export function formatKickoffTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export type DayGroup = {
  dayKey: string;
  label: string;
  games: GameView[];
};

/** Sort by kickoff, then group by local calendar day. */
export function groupGamesByDay(games: GameView[], maxGames?: number): DayGroup[] {
  const sorted = [...games].sort((a, b) => a.startTs - b.startTs);
  const capped = maxGames != null ? sorted.slice(0, maxGames) : sorted;
  const map = new Map<string, GameView[]>();
  for (const g of capped) {
    const dk = dayKeyLocal(g.startTs);
    if (!map.has(dk)) map.set(dk, []);
    map.get(dk)!.push(g);
  }
  const keys = [...map.keys()].sort();
  return keys.map((dayKey) => {
    const list = map.get(dayKey)!;
    const first = list[0];
    return {
      dayKey,
      label: first ? formatDayHeader(first.startTs) : dayKey,
      games: list,
    };
  });
}
