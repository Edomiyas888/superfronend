import { groupGamesByDay } from '../utils/matchDayGrouping';
import type { GameView } from '../api/types';
import MatchListRow from './MatchListRow';

type Props = {
  games: GameView[] | undefined;
  isPending?: boolean;
  isError?: boolean;
  error?: unknown;
  emptyMessage: string;
  /** Cap total fixtures after sorting by time (e.g. home featured list). */
  maxGames?: number;
  /** Show a LIVE badge instead of kickoff time (in-play list). */
  liveMode?: boolean;
};

export default function MatchListByDate({
  games,
  isPending,
  isError,
  error,
  emptyMessage,
  maxGames,
  liveMode,
}: Props) {
  const groups = games ? groupGamesByDay(games, maxGames) : [];

  return (
    <div className="b365-mm-table">
      {isPending && (
        <div className="b365-mm-status">
          <span className="b365-muted">Loading matches…</span>
        </div>
      )}
      {isError && (
        <div className="b365-mm-status">
          <span className="b365-error">{error instanceof Error ? error.message : 'Failed to load'}</span>
        </div>
      )}
      {!isPending &&
        !isError &&
        groups.map((day) => (
          <section key={day.dayKey} className="b365-mm-day" aria-label={day.label}>
            <header className="b365-mm-day-head">
              <span className="b365-mm-day-title">{day.label}</span>
              <span className="b365-mm-day-tools" aria-hidden />
              <div className="b365-mm-day-cols" aria-hidden>
                <span>1</span>
                <span>X</span>
                <span>2</span>
                <div className="b365-mm-day-cols-extra">
                  <span>1X</span>
                  <span>12</span>
                  <span>2X</span>
                </div>
              </div>
            </header>
            {day.games.map((g) => (
              <MatchListRow key={g.id} game={g} liveMode={liveMode} />
            ))}
          </section>
        ))}
      {!isPending && !isError && games && games.length === 0 && (
        <div className="b365-mm-status">
          <span className="b365-muted">{emptyMessage}</span>
        </div>
      )}
    </div>
  );
}
