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
  buySpin,
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
  MAX_SPINS_PER_EVENT,
  SPIN_TIERS,
  WHEEL_SEGMENTS,
  findSegment,
  formatChance,
  formatCountdown,
  formatWhole,
  nextTier,
  spinsLabel,
  type WheelSegment,
} from '../features/spin/spinRules';
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
  paid,
  available,
  price,
  onSpinAgain,
  onBuy,
  onClose,
}: {
  prize: WheelSegment;
  paid: boolean;
  available: number;
  price: number;
  onSpinAgain: () => void;
  onBuy: () => void;
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
        <p className="b365-spin-result__detail">
          {paid ? prize.detail : 'Your prize is on its way — it can take a few minutes to reach your account.'}
        </p>
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
            <button type="button" className="b365-spin__btn" onClick={onBuy}>
              Buy another spin · {price} ETB
            </button>
            <Link to={cta.to} className="b365-spin-result__link">
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
  const [won, setWon] = useState<{ prize: WheelSegment; paid: boolean } | null>(null);
  const [sessionWins, setSessionWins] = useState<WheelSegment[]>([]);
  const [error, setError] = useState<string | null>(null);

  /** Use an earned spin, or (`buy`) pay for one and spin it at once. */
  const onSpin = async (buy = false) => {
    if (spinning) return;
    unlockSpinAudio();
    setError(null);
    setWon(null);
    setWinnerIndex(null);
    setSpinning(true);
    try {
      const result = await (buy ? buySpin(authHeaders) : spinWheel(authHeaders));
      const index = WHEEL_SEGMENTS.findIndex((s) => s.id === result.prizeId);
      await wheelRef.current?.spin(index);
      const prize = findSegment(result.prizeId) ?? null;
      setWinnerIndex(index);
      spinWin(prize?.tone === 'grand' || prize?.tone === 'big');
      queryClient.setQueryData(statusKey, result.status);
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      // Let the winning slice glow for a beat before the card covers it.
      window.setTimeout(() => {
        setWon(prize ? { prize, paid: result.paid } : null);
        if (prize) setSessionWins((list) => [prize, ...list].slice(0, 12));
      }, 650);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not spin. Please try again.');
      void queryClient.invalidateQueries({ queryKey: statusKey });
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
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
          {statusQ.isPending ? 'Loading…' : 'Spin & Win isn’t available right now. Check back soon.'}
        </p>
      </div>
    );
  }

  const { event, player, price } = status;
  const phase = spinPhase(event, now);
  const available = player?.available ?? 0;
  const next = nextTier(player?.deposited ?? 0);
  const canSpin = Boolean(username) && available > 0 && !spinning;
  const buyButton = (
    <button type="button" className="b365-spin__btn is-ready" disabled={spinning} onClick={() => void onSpin(true)}>
      {spinning ? 'Good luck…' : `Buy a spin · ${price} ETB`}
    </button>
  );

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
  } else {
    action = buyButton;
  }

  return (
    <div className="b365-spin">
      <SpinSprite />

      <header className="b365-spin__head">
        <div>
          <h1 className="b365-spin__title">Spin &amp; Win</h1>
          <p className={`b365-spin__badge${phase === 'live' ? ' is-live' : ''}`}>
            <span className="b365-spin-card__dot" aria-hidden /> Daily · free spins reset in{' '}
            <b>{formatCountdown(Date.parse(event.endsAt) - now)}</b>
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
          <p className="b365-spin__muted">Use your free spins before midnight, or buy one for {price} ETB</p>
        ) : username && !spinning ? (
          <p className="b365-spin__muted">
            {next ? (
              <>
                Or <Link to="/wallet">deposit {formatWhole(next.remaining)} ETB today</Link> for a free spin
              </>
            ) : (
              `You've had today's ${MAX_SPINS_PER_EVENT} free spins — more tomorrow`
            )}
          </p>
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
            Deposits approved today (East Africa time) earn free spins:{' '}
            {SPIN_TIERS.map((t) => `${t.at.toLocaleString('en-US')} ETB = ${spinsLabel(t.spins)}`).join(', ')}
          </li>
          <li>Up to {MAX_SPINS_PER_EVENT} free spins a day, however many deposits you make</li>
          <li>Free spins left at midnight expire. A deposit still being reviewed counts on the day it&apos;s approved</li>
          <li>
            You can also buy a spin for {price} ETB from your cash balance (not bonus). It spins straight away, with the
            same prizes and odds
          </li>
          <li>Bonus prizes go to your bonus balance and follow its play-through rules before they can be withdrawn</li>
          <li>
            Keno tickets are 2 ETB Fast Keno bets valid for 7 days; wins pay without the stake and must be bet once
            before withdrawal
          </li>
          <li>The {GRAND} ETB cash prize goes to your cash balance and can be won once a month across all players</li>
        </ul>
        <table className="b365-spin__odds">
          <caption>Prize odds, per spin</caption>
          <tbody>
            {[...WHEEL_SEGMENTS]
              .sort((a, b) => b.chance - a.chance)
              .map((s) => (
                <tr key={s.id}>
                  <th scope="row">{s.label}</th>
                  <td>{formatChance(s.chance)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>

      {won ? (
        <WinCard
          key={sessionWins.length}
          prize={won.prize}
          paid={won.paid}
          available={available}
          price={price}
          onSpinAgain={() => void onSpin()}
          onBuy={() => void onSpin(true)}
          onClose={() => setWon(null)}
        />
      ) : null}
    </div>
  );
}
