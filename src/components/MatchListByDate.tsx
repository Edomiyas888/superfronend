import { Link } from 'react-router-dom';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import { toggleMatchOdd } from '../features/betslip/toggleMatchOdd';
import type { GameView } from '../api/types';
import { groupGamesByDay } from '../utils/matchDayGrouping';
import { formatMatchListClock } from '../utils/matchListClock';
import { useOddPriceFlash } from '../hooks/useOddPriceFlash';
import OddsFlashArrow from './OddsFlashArrow';
import LockGlyph from './LockGlyph';
import TeamLogo from './TeamLogo';

function MmOddButton({
  price,
  selected,
  onClick,
}: {
  price: number;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const flash = useOddPriceFlash(price);
  return (
    <button
      type="button"
      className={`b365-mm-odd ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <span className="b365-odd-price-with-flash">
        <OddsFlashArrow flash={flash} />
        <span>{price.toFixed(2)}</span>
      </span>
    </button>
  );
}

function StatsGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 19V5M10 19V9M16 19v-6M22 19V12" />
    </svg>
  );
}

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
              const isLiveRow = !!(liveMode || g.isLive);
              const showScores = isLiveRow && g.homeScore != null && g.awayScore != null;
              const clockText = formatMatchListClock(g, isLiveRow);
              const matchTitle = g.competitionName ? `${g.team1} vs ${g.team2} · ${g.competitionName}` : undefined;
              return (
                <div key={g.id} className="b365-mm-row">
                  <Link
                    to={`/match/${g.id}`}
                    className="b365-mm-cell b365-mm-t1"
                    title={matchTitle}
                  >
                    <div className="b365-mm-team-line">
                      <TeamLogo
                        teamId={g.team1Id}
                        name={g.team1}
                        className="b365-mm-team-logo"
                        fallbackClassName="b365-mm-team-logo-fallback"
                      />
                      <span className="b365-mm-team-name">{g.team1}</span>
                      {showScores ? <span className="b365-mm-score-pill">{g.homeScore}</span> : null}
                    </div>
                  </Link>

                  <Link to={`/match/${g.id}`} className="b365-mm-cell b365-mm-t2" title={matchTitle}>
                    <div className="b365-mm-team-line">
                      <TeamLogo
                        teamId={g.team2Id}
                        name={g.team2}
                        className="b365-mm-team-logo"
                        fallbackClassName="b365-mm-team-logo-fallback"
                      />
                      <span className="b365-mm-team-name">{g.team2}</span>
                      {showScores ? <span className="b365-mm-score-pill">{g.awayScore}</span> : null}
                    </div>
                  </Link>

                  <div className="b365-mm-cell b365-mm-odds" role="group" aria-label="Match result odds">
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
                            <MmOddButton
                              key={leg}
                              price={cell.price}
                              selected={sel}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleMatchOdd(g, mr, leg, addSelection, removeSelection, slipEvents);
                              }}
                            />
                          );
                        })}
                      </>
                    ) : isLiveRow ? (
                      <>
                        {([0, 1, 2] as const).map((i) => (
                          <button
                            key={i}
                            type="button"
                            className="b365-mm-odd b365-mm-odd--locked"
                            disabled
                            aria-label="Match result odds locked"
                          >
                            <LockGlyph className="b365-mm-lock-ico" />
                          </button>
                        ))}
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

                  <div className="b365-mm-cell b365-mm-foot">
                    <span className="b365-mm-clock">
                      {isLiveRow && clockText === 'Live' ? (
                        <span className="b365-mm-live">Live</span>
                      ) : (
                        clockText
                      )}
                    </span>
                    {g.competitionName ? (
                      <span className="b365-mm-comp">· {g.competitionName}</span>
                    ) : null}
                    <span className="b365-mm-footer-icons">
                      <span className="b365-mm-stats-wrap" title="Statistics" aria-label="Statistics">
                        <StatsGlyph className="b365-mm-stats-ico" />
                      </span>
                      <span className="b365-mm-stream" title="Match centre">
                        ▶
                      </span>
                      <span className="b365-mm-markets">
                        {g.marketsCount} »
                      </span>
                    </span>
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
