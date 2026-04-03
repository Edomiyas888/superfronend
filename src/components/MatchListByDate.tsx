import { Link } from 'react-router-dom';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import { toggleMatchOdd } from '../features/betslip/toggleMatchOdd';
import type { GameView } from '../api/types';
import { groupGamesByDay, formatKickoffTime } from '../utils/matchDayGrouping';
import TeamLogo from './TeamLogo';

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
  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const slipEvents = useBetslipStore((s) => s.events);

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
              <div className="b365-mm-day-cols" aria-hidden>
                <span>1</span>
                <span>X</span>
                <span>2</span>
              </div>
            </header>
            {day.games.map((g) => {
              const mr = g.matchResult1x2;
              return (
                <div key={g.id} className="b365-mm-row">
                  <Link to={`/match/${g.id}`} className="b365-mm-left">
                    <div className="b365-mm-teams">
                      <div className="b365-mm-team-line">
                        <TeamLogo
                          teamId={g.team1Id}
                          name={g.team1}
                          className="b365-mm-team-logo"
                          fallbackClassName="b365-mm-team-logo-fallback"
                        />
                        <span className="b365-mm-team-name">{g.team1}</span>
                      </div>
                      <div className="b365-mm-team-line">
                        <TeamLogo
                          teamId={g.team2Id}
                          name={g.team2}
                          className="b365-mm-team-logo"
                          fallbackClassName="b365-mm-team-logo-fallback"
                        />
                        <span className="b365-mm-team-name">{g.team2}</span>
                      </div>
                    </div>
                    <div className="b365-mm-bottom">
                      <div className="b365-mm-meta">
                        {liveMode || g.isLive ? (
                          <span className="b365-mm-live">Live</span>
                        ) : (
                          <span className="b365-mm-time">{formatKickoffTime(g.startTs)}</span>
                        )}
                        {g.competitionName ? (
                          <span className="b365-mm-comp">· {g.competitionName}</span>
                        ) : null}
                      </div>
                      <div className="b365-mm-actions">
                        <span className="b365-mm-stream" title="Streaming">
                          ▶
                        </span>
                        <span className="b365-mm-markets">
                          {g.marketsCount} »
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="b365-mm-odds" role="group" aria-label="Match result odds">
                    {mr ? (
                      <>
                        {(
                          [
                            ['home', mr.home] as const,
                            ['draw', mr.draw] as const,
                            ['away', mr.away] as const,
                          ] as const
                        ).map(([leg, cell]) => {
                          const sel = !!slipEvents[keyFor(g.id, mr.marketId, cell.eventId)];
                          return (
                            <button
                              key={leg}
                              type="button"
                              className={`b365-mm-odd ${sel ? 'selected' : ''}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleMatchOdd(g, mr, leg, addSelection, removeSelection, slipEvents);
                              }}
                            >
                              {cell.price.toFixed(2)}
                            </button>
                          );
                        })}
                      </>
                    ) : (
                      <>
                        {(['—', '—', '—'] as const).map((dash, i) => (
                          <button key={i} type="button" className="b365-mm-odd muted" disabled>
                            {dash}
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
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
