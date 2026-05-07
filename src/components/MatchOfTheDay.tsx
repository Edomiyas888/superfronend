import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Link } from 'react-router-dom';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import { toggleMatchOdd } from '../features/betslip/toggleMatchOdd';
import { useMatchOfTheDay } from '../hooks/useMatchOfTheDay';
import { selectMatchOfTheDayGames } from '../utils/matchOfDaySelect';
import { formatMatchListClock } from '../utils/matchListClock';
import { useOddPriceFlash } from '../hooks/useOddPriceFlash';
import OddsFlashArrow from './OddsFlashArrow';
import LockGlyph from './LockGlyph';
import TeamLogo from './TeamLogo';
import type { BetslipEventLike } from '../api/placeBet';
import type { GameView } from '../api/types';

function formatMotdKickoff(ts: number): string {
  const d = new Date(ts * 1000);
  const t = d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const today = new Date();
  const kick = new Date(ts * 1000);
  if (kick.toDateString() === today.toDateString()) {
    return t;
  }
  const dateStr = d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });
  return `${dateStr} · ${t}`;
}

const MOTD_DESKTOP_MIN_WIDTH = 1000;
const MOTD_DESKTOP_PAGE_SIZE = 4;

function useMatchMediaMinWidth(minWidth: number): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(`(min-width: ${minWidth}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [minWidth]);

  return matches;
}

function MotdSkeletonCardBody() {
  return (
    <>
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
    </>
  );
}

function MotdSkeleton({ variant }: { variant: 'mobile' | 'desktop' }) {
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
      {variant === 'desktop' ? (
        <div className="b365-motd-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="b365-motd-card b365-motd-card--skeleton">
              <MotdSkeletonCardBody />
            </div>
          ))}
        </div>
      ) : (
        <div className="b365-motd-card b365-motd-card--skeleton">
          <MotdSkeletonCardBody />
        </div>
      )}
    </div>
  );
}

function MotdMatchCard({
  g,
  slipEvents,
  addSelection,
  removeSelection,
  swipeGuardRef,
}: {
  g: GameView;
  slipEvents: Record<string, BetslipEventLike>;
  addSelection: ReturnType<typeof useBetslipStore.getState>['addSelection'];
  removeSelection: ReturnType<typeof useBetslipStore.getState>['removeSelection'];
  swipeGuardRef?: MutableRefObject<number>;
}) {
  const live = g.isLive;
  const showLiveScores = live && g.homeScore != null && g.awayScore != null;
  const liveClock = formatMatchListClock(g, true);

  return (
    <div className="b365-motd-card">
      <Link
        to={`/match/${g.id}`}
        className="b365-motd-card-main"
        onClick={(ev) => {
          if (swipeGuardRef && Date.now() - swipeGuardRef.current < 450) ev.preventDefault();
        }}
      >
        <div className="b365-motd-teams">
          <div className="b365-motd-team">
            <TeamLogo
              teamId={g.team1Id}
              name={g.team1}
              className="b365-motd-logo"
              fallbackClassName="b365-motd-logo-fallback"
            />
            <div className="b365-motd-team-line">
              <span className="b365-motd-name">{g.team1}</span>
              {showLiveScores ? <span className="b365-motd-score-pill">{g.homeScore}</span> : null}
            </div>
          </div>
          <div className={`b365-motd-vs ${live ? 'b365-motd-vs--live' : ''}`}>
            {live ? (
              <>
                <span className="b365-motd-live-badge">Live</span>
                <span className="b365-motd-time b365-motd-time--live">
                  {liveClock === 'Live' ? 'In play' : liveClock}
                </span>
              </>
            ) : (
              <>
                <span className="b365-motd-vs-text">VS</span>
                <span className="b365-motd-kickoff">{formatMotdKickoff(g.startTs)}</span>
              </>
            )}
          </div>
          <div className="b365-motd-team">
            <TeamLogo
              teamId={g.team2Id}
              name={g.team2}
              className="b365-motd-logo"
              fallbackClassName="b365-motd-logo-fallback"
            />
            <div className="b365-motd-team-line">
              <span className="b365-motd-name">{g.team2}</span>
              {showLiveScores ? <span className="b365-motd-score-pill">{g.awayScore}</span> : null}
            </div>
          </div>
        </div>
      </Link>
      <MotdOddsRow g={g} slipEvents={slipEvents} addSelection={addSelection} removeSelection={removeSelection} />
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
  const [desktopPage, setDesktopPage] = useState(0);
  const isDesktop = useMatchMediaMinWidth(MOTD_DESKTOP_MIN_WIDTH);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const lastSwipeAtRef = useRef(0);

  useEffect(() => {
    setActiveIndex((i) => {
      if (matches.length === 0) return 0;
      return Math.min(i, matches.length - 1);
    });
  }, [matches.length]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(matches.length / MOTD_DESKTOP_PAGE_SIZE) - 1);
    setDesktopPage((p) => Math.min(p, maxPage));
  }, [matches.length]);

  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const slipEvents = useBetslipStore((s) => s.events);

  if (q.isPending) {
    return <MotdSkeleton variant={isDesktop ? 'desktop' : 'mobile'} />;
  }
  if (q.isError || matches.length === 0) {
    return null;
  }

  const desktopMaxPage = Math.max(0, Math.ceil(matches.length / MOTD_DESKTOP_PAGE_SIZE) - 1);
  const desktopSlice = matches.slice(
    desktopPage * MOTD_DESKTOP_PAGE_SIZE,
    desktopPage * MOTD_DESKTOP_PAGE_SIZE + MOTD_DESKTOP_PAGE_SIZE
  );

  const navPrevDisabled = isDesktop
    ? desktopPage === 0 || desktopMaxPage === 0
    : matches.length <= 1;
  const navNextDisabled = isDesktop
    ? desktopPage >= desktopMaxPage || desktopMaxPage === 0
    : matches.length <= 1;

  const onNavPrev = () => {
    if (isDesktop) {
      setDesktopPage((p) => Math.max(0, p - 1));
      return;
    }
    setActiveIndex((prev) => (prev === 0 ? Math.max(0, matches.length - 1) : prev - 1));
  };

  const onNavNext = () => {
    if (isDesktop) {
      setDesktopPage((p) => Math.min(desktopMaxPage, p + 1));
      return;
    }
    setActiveIndex((prev) => (prev + 1) % matches.length);
  };

  if (isDesktop) {
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
              disabled={navPrevDisabled}
              onClick={onNavPrev}
              aria-label="Previous matches"
            >
              ‹
            </button>
            <button
              type="button"
              className="b365-motd-nav-btn"
              disabled={navNextDisabled}
              onClick={onNavNext}
              aria-label="Next matches"
            >
              ›
            </button>
          </div>
        </div>

        <div className="b365-motd-grid">
          {desktopSlice.map((game) => (
            <MotdMatchCard
              key={game.id}
              g={game}
              slipEvents={slipEvents}
              addSelection={addSelection}
              removeSelection={removeSelection}
            />
          ))}
        </div>
      </div>
    );
  }

  const g = matches[activeIndex];
  if (!g) return null;

  const swipeMinPx = 48;
  const swipeAxisRatio = 1.25;

  const onSwipePointerDown = (e: React.PointerEvent) => {
    if (matches.length <= 1 || e.button !== 0) return;
    swipeStartRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onSwipePointerUp = (e: React.PointerEvent) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || start.pointerId !== e.pointerId || matches.length <= 1) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX < swipeMinPx || absX < absY * swipeAxisRatio) return;
    lastSwipeAtRef.current = Date.now();
    if (dx < 0) {
      setActiveIndex((prev) => (prev + 1) % matches.length);
    } else {
      setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length);
    }
  };

  const onSwipePointerCancel = (e: React.PointerEvent) => {
    if (swipeStartRef.current?.pointerId === e.pointerId) swipeStartRef.current = null;
  };

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
            disabled={navPrevDisabled}
            onClick={onNavPrev}
            aria-label="Previous match"
          >
            ‹
          </button>
          <button
            type="button"
            className="b365-motd-nav-btn"
            disabled={navNextDisabled}
            onClick={onNavNext}
            aria-label="Next match"
          >
            ›
          </button>
        </div>
      </div>

      <div
        className="b365-motd-swiper"
        role="region"
        aria-label="Swipe or use arrows to change featured match"
        onPointerDown={onSwipePointerDown}
        onPointerUp={onSwipePointerUp}
        onPointerCancel={onSwipePointerCancel}
      >
        <MotdMatchCard
          g={g}
          slipEvents={slipEvents}
          addSelection={addSelection}
          removeSelection={removeSelection}
          swipeGuardRef={lastSwipeAtRef}
        />

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
    </div>
  );
}

function MotdOddButton({
  label,
  price,
  selected,
  onClick,
}: {
  label: string;
  price: number;
  selected: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  const flash = useOddPriceFlash(price);
  return (
    <button type="button" className={`b365-motd-odd ${selected ? 'selected' : ''}`} onClick={onClick}>
      <span className="b365-motd-odd-label">{label}</span>
      <span className="b365-motd-odd-val">
        <span className="b365-odd-price-with-flash b365-motd-odd-val-inner">
          <OddsFlashArrow flash={flash} />
          <span>{price.toFixed(2)}</span>
        </span>
      </span>
    </button>
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
    if (g.isLive) {
      return (
        <div className="b365-motd-odds">
          {[0, 1, 2].map((i) => (
            <div key={i} className="b365-motd-odd b365-motd-odd--locked" aria-label="Odds locked">
              <LockGlyph className="b365-motd-lock-ico" />
            </div>
          ))}
        </div>
      );
    }
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
          <MotdOddButton
            key={leg}
            label={label}
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
    </div>
  );
}
