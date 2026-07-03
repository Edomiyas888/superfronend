import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import { toggleMatchOdd } from '../features/betslip/toggleMatchOdd';
import { useMatchOfTheDay } from '../hooks/useMatchOfTheDay';
import { selectMatchOfTheDayGames } from '../utils/matchOfDaySelect';
import { formatMotdLiveDisplay } from '../utils/matchListClock';
import { useOddPriceFlash } from '../hooks/useOddPriceFlash';
import OddsFlashArrow from './OddsFlashArrow';
import LockGlyph from './LockGlyph';
import TeamLogo from './TeamLogo';
import type { BetslipEventLike } from '../api/placeBet';
import type { GameView } from '../api/types';

const AUTO_INTERVAL_MS = 5000;

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

function MotdSkeleton() {
  return (
    <div className="b365-motd">
      <div className="b365-motd-card b365-motd-card--skeleton">
        <div className="b365-motd-teams">
          <div className="b365-motd-team">
            <div className="b365-motd-skel b365-motd-skel--logo" />
            <div className="b365-motd-skel b365-motd-skel--text" />
          </div>
          <div className="b365-motd-vs">
            <div className="b365-motd-skel b365-motd-skel--vs" />
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
      <div className="b365-motd-dots" aria-hidden>
        <span className="b365-motd-dot" />
        <span className="b365-motd-dot active" />
        <span className="b365-motd-dot" />
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
  const [paused, setPaused] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const lastSwipeAtRef = useRef(0);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    setActiveIndex((i) => {
      if (matches.length === 0) return 0;
      return Math.min(i, matches.length - 1);
    });
  }, [matches.length]);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  useEffect(() => {
    if (matches.length <= 1 || paused || prefersReducedMotion.current) return;
    const id = window.setInterval(goNext, AUTO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [matches.length, paused, goNext]);

  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const slipEvents = useBetslipStore((s) => s.events);

  if (q.isPending) {
    return <MotdSkeleton />;
  }
  if (q.isError || matches.length === 0) {
    return null;
  }

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
    setPaused(true);
    window.setTimeout(() => setPaused(false), AUTO_INTERVAL_MS * 2);
    if (dx < 0) goNext();
    else goPrev();
  };

  const onSwipePointerCancel = (e: React.PointerEvent) => {
    if (swipeStartRef.current?.pointerId === e.pointerId) swipeStartRef.current = null;
  };

  return (
    <div className="b365-motd">
      <div
        className="b365-motd-carousel"
        role="region"
        aria-label="Featured matches carousel"
        aria-live="polite"
        onPointerDown={onSwipePointerDown}
        onPointerUp={onSwipePointerUp}
        onPointerCancel={onSwipePointerCancel}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div
          className="b365-motd-track"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {matches.map((g) => (
            <MotdSlide
              key={g.id}
              g={g}
              slipEvents={slipEvents}
              addSelection={addSelection}
              removeSelection={removeSelection}
              lastSwipeAtRef={lastSwipeAtRef}
            />
          ))}
        </div>
      </div>

      {matches.length > 1 && (
        <div className="b365-motd-dots" role="tablist" aria-label="Match carousel">
          {matches.map((m, index) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={index === activeIndex}
              aria-label={`Slide ${index + 1} of ${matches.length}`}
              className={`b365-motd-dot ${index === activeIndex ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(index);
                setPaused(true);
                window.setTimeout(() => setPaused(false), AUTO_INTERVAL_MS * 2);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MotdSlide({
  g,
  slipEvents,
  addSelection,
  removeSelection,
  lastSwipeAtRef,
}: {
  g: GameView;
  slipEvents: Record<string, BetslipEventLike>;
  addSelection: ReturnType<typeof useBetslipStore.getState>['addSelection'];
  removeSelection: ReturnType<typeof useBetslipStore.getState>['removeSelection'];
  lastSwipeAtRef: React.MutableRefObject<number>;
}) {
  const live = g.isLive;
  const liveDisplay = live ? formatMotdLiveDisplay(g) : null;

  return (
    <div className="b365-motd-slide">
      <div className="b365-motd-card">
        <Link
          to={`/match/${g.id}`}
          className="b365-motd-card-main"
          onClick={(ev) => {
            if (Date.now() - lastSwipeAtRef.current < 450) ev.preventDefault();
          }}
        >
          <div className="b365-motd-teams">
            <div className="b365-motd-team">
              <div className="b365-motd-logo-wrap">
                <TeamLogo
                  teamId={g.team1Id}
                  name={g.team1}
                  className="b365-motd-logo"
                  fallbackClassName="b365-motd-logo-fallback"
                />
              </div>
              <span className="b365-motd-name">{g.team1}</span>
            </div>

            <div className={`b365-motd-vs ${live ? 'b365-motd-vs--live' : ''}`}>
              {live && liveDisplay ? (
                <>
                  <span className="b365-motd-live-badge">Live</span>
                  {liveDisplay.showScore ? (
                    <span
                      className="b365-motd-live-score"
                      aria-label={`Score ${liveDisplay.home} to ${liveDisplay.away}`}
                    >
                      <span>{liveDisplay.home}</span>
                      <span className="b365-motd-live-score-sep">:</span>
                      <span>{liveDisplay.away}</span>
                    </span>
                  ) : null}
                  <span className="b365-motd-time b365-motd-time--live">{liveDisplay.clock}</span>
                </>
              ) : (
                <>
                  <span className="b365-motd-vs-text">VS</span>
                  <span className="b365-motd-kickoff">{formatMotdKickoff(g.startTs)}</span>
                </>
              )}
            </div>

            <div className="b365-motd-team">
              <div className="b365-motd-logo-wrap">
                <TeamLogo
                  teamId={g.team2Id}
                  name={g.team2}
                  className="b365-motd-logo"
                  fallbackClassName="b365-motd-logo-fallback"
                />
              </div>
              <span className="b365-motd-name">{g.team2}</span>
            </div>
          </div>
        </Link>
        <MotdOddsRow g={g} slipEvents={slipEvents} addSelection={addSelection} removeSelection={removeSelection} />
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
      <span className="b365-odd-price-with-flash b365-motd-odd-val">
        <OddsFlashArrow flash={flash} />
        <span>{price.toFixed(2)}</span>
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
    ['home', 'W1', mr.home] as const,
    ['draw', 'X', mr.draw] as const,
    ['away', 'W2', mr.away] as const,
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
