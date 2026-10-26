import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import SpinWheel, { type SpinWheelHandle } from '../features/spin/SpinWheel';
import SpinSprite, { PrizeIcon } from '../features/spin/SpinSprite';
import SpinProgress from '../features/spin/SpinProgress';
import SpinLiveWins from '../features/spin/SpinLiveWins';
import Confetti from '../features/spin/Confetti';
import {
  spinPhase,
  spinWheel,
  useNowTick,
  useSpinAuthHeaders,
  useSpinStatus,
  useSpinStatusKey,
} from '../features/spin/spinApi';
import { isSpinMuted, setSpinMuted, spinWin, unlockSpinAudio } from '../features/spin/spinFx';
import {
  GRAND_PRIZE,
  WHEEL_SEGMENTS,
  findSegment,
  formatCountdown,
  formatEventDay,
  formatEventTime,
  spinsLabel,
  type WheelSegment,
} from '../features/spin/spinRules';
import { formatTimeLeft } from '../features/freeBet/freeBetRules';
import giftImage from '../assets/home-gift.webp';

const GRAND = GRAND_PRIZE.toLocaleString('en-US');

/** Counts from 0 up to `target` once, for the prize reveal. */
function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    const start = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function prizeHeadline(prize: WheelSegment, shown: number) {
  if (prize.id === 'keno5') return `${shown} free tickets`;
  return `+${shown.toLocaleString('en-US')} ETB`;
}

function prizeKind(prize: WheelSegment) {
  if (prize.id === 'keno5') return 'Fast Keno · 2 ETB each';
  if (prize.tone === 'grand') return 'Cash prize';
  return 'Bonus';
}

function prizeCta(prize: WheelSegment) {
  if (prize.id === 'keno5') return { to: '/keno', label: 'Play Fast Keno' };
  if (prize.tone === 'grand') return { to: '/wallet', label: 'Go to wallet' };
  return { to: '/', label: 'Bet with it' };
}

function WinCard({
  prize,
  available,
  onSpinAgain,
  onClose,
}: {
  prize: WheelSegment;
  available: number;
  onSpinAgain: () => void;
  onClose: () => void;
}) {
  const shown = useCountUp(prize.amount);
  const cta = prizeCta(prize);
  const grand = prize.tone === 'grand';
  return (
    <div className="b365-spin-result" role="dialog" aria-modal="true" aria-labelledby="spin-result-title">
      <Confetti pieces={grand ? 260 : 140} />
      <div className={`b365-spin-result__card${grand ? ' is-grand' : ''}`}>
        <div className="b365-spin-result__art" aria-hidden>
          <span className="b365-spin-result__rays" />
          <img src={giftImage} alt="" className="b365-spin-result__gift" draggable={false} />
          <PrizeIcon icon={prize.icon} size={84} className="b365-spin-result__icon" />
        </div>
        <p className="b365-spin-result__eyebrow">{grand ? 'Jackpot!' : 'You won'}</p>
        <p id="spin-result-title" className="b365-spin-result__amount" aria-label={prize.label}>
          {prizeHeadline(prize, shown)}
        </p>
        <p className="b365-spin-result__kind">{prizeKind(prize)}</p>
        <p className="b365-spin-result__detail">{prize.detail}</p>
        {available > 0 ? (
          <>
            <button type="button" className="b365-spin__btn" onClick={onSpinAgain}>
              Spin again · {spinsLabel(available)} left
            </button>
            <Link to={cta.to} className="b365-spin-result__link">
              {cta.label}
            </Link>
          </>
        ) : (
          <>
            <Link to={cta.to} className="b365-spin__btn">
              {cta.label}
            </Link>
            <button type="button" className="b365-spin-result__link" onClick={onClose}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function SoundToggle() {
  const [muted, setMuted] = useState(isSpinMuted);
  return (
    <button
      type="button"
      className="b365-spin__sound"
      aria-pressed={!muted}
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      onClick={() => {
        setSpinMuted(!muted);
        setMuted(!muted);
      }}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
        <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
        {muted ? (
          <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        ) : (
          <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}

export default function SpinPage() {
  const username = useSessionStore((s) => s.username);
  const authHeaders = useSpinAuthHeaders();
  const queryClient = useQueryClient();
  const statusKey = useSpinStatusKey();
  const statusQ = useSpinStatus();
  const now = useNowTick(Boolean(statusQ.data));

  const wheelRef = useRef<SpinWheelHandle>(null);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [won, setWon] = useState<WheelSegment | null>(null);
  const [sessionWins, setSessionWins] = useState<WheelSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onSpin = async () => {
    if (spinning) return;
    unlockSpinAudio();
    setError(null);
    setWon(null);
    setWinnerIndex(null);
    setSpinning(true);
    try {
      const result = await spinWheel(authHeaders);
      const index = WHEEL_SEGMENTS.findIndex((s) => s.id === result.prizeId);
      await wheelRef.current?.spin(index);
      const prize = findSegment(result.prizeId) ?? null;
      setWinnerIndex(index);
      spinWin(prize?.tone === 'grand' || prize?.tone === 'big');
      queryClient.setQueryData(statusKey, result.status);
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      // Let the winning slice glow for a beat before the card covers it.
      window.setTimeout(() => {
        setWon(prize);
        if (prize) setSessionWins((list) => [prize, ...list].slice(0, 12));
      }, 650);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not spin. Please try again.');
      void queryClient.invalidateQueries({ queryKey: statusKey });
    } finally {
      setSpinning(false);
    }
  };

  const status = statusQ.data;
  if (statusQ.isPending || !status) {
    return (
      <div className="b365-spin">
        <h1 className="b365-spin__title">Spin &amp; Win</h1>
        <p className="b365-spin__muted">
          {statusQ.isPending ? 'Loading…' : 'Spin & Win isn’t running right now. Check back soon.'}
        </p>
      </div>
    );
  }

  const { event, player } = status;
  const phase = spinPhase(event, now);
  const available = player?.available ?? 0;
  const hour = `${formatEventTime(event.startsAt)}–${formatEventTime(event.endsAt)}`;
  const canSpin = Boolean(username) && available > 0 && !spinning;

  let action: JSX.Element;
  if (!username) {
    action = (
      <Link to="/profile" className="b365-spin__btn">
        Log in to play
      </Link>
    );
  } else if (available > 0 || spinning) {
    action = (
      <button type="button" className="b365-spin__btn is-ready" disabled={spinning} onClick={() => void onSpin()}>
        {spinning ? 'Good luck…' : 'Spin the wheel'}
      </button>
    );
  } else if (phase === 'upcoming') {
    action = (
      <button type="button" className="b365-spin__btn" disabled>
        Starts in {formatCountdown(Date.parse(event.startsAt) - now)}
      </button>
    );
  } else if (phase === 'live') {
    action = (
      <Link to="/wallet" className="b365-spin__btn">
        Deposit to earn a spin
      </Link>
    );
  } else {
    action = (
      <button type="button" className="b365-spin__btn" disabled>
        Spin &amp; Win is over
      </button>
    );
  }

  return (
    <div className="b365-spin">
      <SpinSprite />

      <header className="b365-spin__head">
        <div>
          <h1 className="b365-spin__title">Spin &amp; Win</h1>
          <p className={`b365-spin__badge${phase === 'live' ? ' is-live' : ''}`}>
            {phase === 'live' ? (
              <>
                <span className="b365-spin-card__dot" aria-hidden /> Live · ends in{' '}
                <b>{formatCountdown(Date.parse(event.endsAt) - now)}</b>
              </>
            ) : phase === 'upcoming' ? (
              <>
                {formatEventDay(event.startsAt)} · {hour}
              </>
            ) : (
              <>Ended at {formatEventTime(event.endsAt)}</>
            )}
          </p>
        </div>
        <SoundToggle />
      </header>

      <p className="b365-spin__hero">
        Win up to <b>{GRAND} ETB</b>
      </p>

      <div className="b365-spin__stage">
        <span className="b365-spin__rays" aria-hidden />
        <SpinWheel
          ref={wheelRef}
          spinning={spinning}
          winnerIndex={winnerIndex}
          hubLabel="SPIN"
          hubSub={username && available > 0 ? `${available} left` : undefined}
          hubDisabled={!canSpin}
          onHubClick={() => void onSpin()}
        />
        <svg className="b365-spin__stand" viewBox="0 0 200 46" aria-hidden>
          <path d="M78 0h44l26 34H52z" fill="url(#spin-rim)" />
          <path d="M78 0h44l3 4H75z" fill="#000" opacity="0.35" />
          <rect x="34" y="34" width="132" height="10" rx="5" fill="url(#spin-rim)" />
        </svg>
      </div>

      <div className="b365-spin__actions">
        {username && available > 0 ? (
          <p className="b365-spin__count">
            <b>{available}</b> {available === 1 ? 'spin' : 'spins'} ready
          </p>
        ) : null}
        {action}
        {available > 0 && !spinning ? (
          <p className="b365-spin__muted">Use your spins within {formatTimeLeft(event.claimUntil)}</p>
        ) : null}
        {error ? (
          <p className="b365-wallet-form__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {sessionWins.length > 0 ? (
        <section className="b365-spin-wins" aria-label="Your wins">
          <h2>Your wins</h2>
          <ul>
            {sessionWins.map((w, i) => (
              <li key={`${w.id}-${sessionWins.length - i}`} className={`is-${w.tone}`}>
                <PrizeIcon icon={w.icon} size={22} />
                {w.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {player ? (
        <SpinProgress
          deposited={player.deposited}
          pending={player.pending}
          currency="ETB"
          live={phase !== 'claim'}
        />
      ) : null}

      <SpinLiveWins />

      <details className="b365-freebet-card__rules b365-spin__rules">
        <summary>Rules</summary>
        <ul>
          <li>
            Deposits you submit between {hour} (East Africa time) earn spins once approved: 100 ETB in total = 1 spin,
            500 ETB = 2, 1,000 ETB or more = 3
          </li>
          <li>Up to 3 spins per player, however many deposits you make</li>
          <li>
            Unused spins expire at {formatEventTime(event.claimUntil)} on {formatEventDay(event.claimUntil)}
          </li>
          <li>Bonus prizes go to your bonus balance and follow its play-through rules before they can be withdrawn</li>
          <li>
            Keno tickets are 2 ETB Fast Keno bets valid for 7 days; wins pay without the stake and must be bet once
            before withdrawal
          </li>
          <li>The {GRAND} ETB cash prize goes to your cash balance and can be won once a month across all players</li>
        </ul>
      </details>

      {won ? (
        <WinCard
          key={sessionWins.length}
          prize={won}
          available={available}
          onSpinAgain={() => void onSpin()}
          onClose={() => setWon(null)}
        />
      ) : null}
    </div>
  );
}
