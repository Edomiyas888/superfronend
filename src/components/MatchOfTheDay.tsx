import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import { toggleMatchOdd } from '../features/betslip/toggleMatchOdd';
import { useMatchOfTheDay } from '../hooks/useMatchOfTheDay';
import { selectMatchOfTheDayGames } from '../utils/matchOfDaySelect';
import { teamLogoUrlCandidates } from '../utils/teamLogos';
import type { BetslipEventLike } from '../api/placeBet';
import type { GameView } from '../api/types';

function formatMotdTime(ts: number): string {
  return new Date(ts * 1000).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatMotdDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
}

function isKickoffToday(ts: number): boolean {
  const d = new Date(ts * 1000);
  const t = new Date();
  return d.toDateString() === t.toDateString();
}

function TeamLogo({
  teamId,
  name,
  className,
}: {
  teamId: number | undefined;
  name: string;
  className?: string;
}) {
  const candidates = useMemo(() => {
    if (teamId == null || !Number.isFinite(teamId) || teamId <= 0) return [];
    return teamLogoUrlCandidates(teamId);
  }, [teamId]);
  const [srcIdx, setSrcIdx] = useState(0);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setSrcIdx(0);
  }, [teamId]);

  if (candidates.length === 0 || srcIdx >= candidates.length) {
    return (
      <div className={`b365-motd-logo-fallback ${className ?? ''}`.trim()} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={candidates[srcIdx]}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
}

function MotdSkeleton() {
  return (
    <div className="b365-motd">
      <div className="b365-motd-header">
        <div className="b365-motd-headline">
          <span className="b365-motd-title">Match of the Day</span>
          <span className="b365-motd-sport">Soccer</span>
        </div>
        <div className="b365-motd-nav" aria-hidden>
          <span className="b365-motd-nav-btn disabled">‹</span>
          <span className="b365-motd-nav-btn disabled">›</span>
        </div>
      </div>
      <div className="b365-motd-card b365-motd-card--skeleton">
        <div className="b365-motd-teams">
          <div className="b365-motd-team">
            <div className="b365-motd-skel b365-motd-skel--logo" />
            <div className="b365-motd-skel b365-motd-skel--text" />
          </div>
          <div className="b365-motd-vs">
            <div className="b365-motd-skel b365-motd-skel--vs" />
            <div className="b365-motd-skel b365-motd-skel--time" />
          </div>
          <div className="b365-motd-team">
            <div className="b365-motd-skel b365-motd-skel--logo" />
            <div className="b365-motd-skel b365-motd-skel--text" />
          </div>
        </div>
        <div className="b365-motd-odds">
          <div className="b365-motd-skel b365-motd-skel--odd" />
          <div className="b365-motd-skel b365-motd-skel--odd" />
          <div className="b365-motd-skel b365-motd-skel--odd" />
        </div>
      </div>
    </div>
  );
}

export default function MatchOfTheDay() {
  const q = useMatchOfTheDay();
  const matches = useMemo(
    () => (q.data ? selectMatchOfTheDayGames(q.data) : []),
    [q.data]
  );
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex((i) => {
      if (matches.length === 0) return 0;
      return Math.min(i, matches.length - 1);
    });
  }, [matches.length]);

  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const slipEvents = useBetslipStore((s) => s.events);

  if (q.isPending) {
    return <MotdSkeleton />;
  }
  if (q.isError || matches.length === 0) {
    return null;
  }

  const g = matches[activeIndex];
  if (!g) return null;

  return (
    <div className="b365-motd">
      <div className="b365-motd-header">
        <div className="b365-motd-headline">
          <span className="b365-motd-title">Match of the Day</span>
          <span className="b365-motd-sport">Soccer</span>
        </div>
        <div className="b365-motd-nav">
          <button
            type="button"
            className="b365-motd-nav-btn"
            disabled={matches.length <= 1}
            onClick={() =>
              setActiveIndex((prev) => (prev === 0 ? Math.max(0, matches.length - 1) : prev - 1))
            }
            aria-label="Previous match"
          >
            ‹
          </button>
          <button
            type="button"
            className="b365-motd-nav-btn"
            disabled={matches.length <= 1}
            onClick={() => setActiveIndex((prev) => (prev + 1) % matches.length)}
            aria-label="Next match"
          >
            ›
          </button>
        </div>
      </div>

      <div className="b365-motd-card">
        <Link to={`/match/${g.id}`} className="b365-motd-card-main">
          <div className="b365-motd-teams">
            <div className="b365-motd-team">
              <TeamLogo teamId={g.team1Id} name={g.team1} className="b365-motd-logo" />
              <span className="b365-motd-name">{g.team1}</span>
            </div>
            <div className="b365-motd-vs">
              <span className="b365-motd-vs-text">VS</span>
              <span className="b365-motd-time">{formatMotdTime(g.startTs)}</span>
              {!isKickoffToday(g.startTs) && (
                <span className="b365-motd-date">{formatMotdDate(g.startTs)}</span>
              )}
            </div>
            <div className="b365-motd-team">
              <TeamLogo teamId={g.team2Id} name={g.team2} className="b365-motd-logo" />
              <span className="b365-motd-name">{g.team2}</span>
            </div>
          </div>
        </Link>
        <MotdOddsRow g={g} slipEvents={slipEvents} addSelection={addSelection} removeSelection={removeSelection} />
      </div>

      {matches.length > 1 && (
        <div className="b365-motd-dots" role="tablist" aria-label="Match carousel">
          {matches.map((_, index) => (
            <button
              key={index}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              className={`b365-motd-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveIndex(index);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MotdOddsRow({
  g,
  slipEvents,
  addSelection,
  removeSelection,
}: {
  g: GameView;
  slipEvents: Record<string, BetslipEventLike>;
  addSelection: ReturnType<typeof useBetslipStore.getState>['addSelection'];
  removeSelection: ReturnType<typeof useBetslipStore.getState>['removeSelection'];
}) {
  const mr = g.matchResult1x2;

  if (!mr) {
    return (
      <div className="b365-motd-odds">
        <span className="b365-muted" style={{ fontSize: 12 }}>
          Odds loading…
        </span>
      </div>
    );
  }

  const cells = [
    ['home', '1', mr.home] as const,
    ['draw', 'X', mr.draw] as const,
    ['away', '2', mr.away] as const,
  ];

  return (
    <div className="b365-motd-odds">
      {cells.map(([leg, label, cell]) => {
        const sel = !!slipEvents[keyFor(g.id, mr.marketId, cell.eventId)];
        return (
          <button
            key={leg}
            type="button"
            className={`b365-motd-odd ${sel ? 'selected' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleMatchOdd(g, mr, leg, addSelection, removeSelection, slipEvents);
            }}
          >
            <span className="b365-motd-odd-label">{label}</span>
            <span className="b365-motd-odd-val">{cell.price.toFixed(2)}</span>
          </button>
        );
      })}
    </div>
  );
}
