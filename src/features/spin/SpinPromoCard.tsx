import { Link } from 'react-router-dom';
import wheelImage from '../../assets/home-spin.webp';
import { spinPhase, useNowTick, useSpinStatus } from './spinApi';
import { GRAND_PRIZE, formatCountdown, formatEventTime, formatWhole, nextTier, spinsLabel } from './spinRules';

type Props = {
  /** On the wallet page the deposit form is already here — switch to it instead of navigating. */
  onDeposit?: () => void;
};

/**
 * Home and wallet banner for the live Spin & Win hour: a countdown before it starts, the next
 * spin to earn while it runs, and spins left to use afterwards. Hidden when no event is set.
 */
export default function SpinPromoCard({ onDeposit }: Props) {
  const { data: status } = useSpinStatus();
  const now = useNowTick(Boolean(status));
  if (!status) return null;

  const { event, player } = status;
  const phase = spinPhase(event, now);
  const prize = `${GRAND_PRIZE.toLocaleString('en-US')} ETB`;
  const available = player?.available ?? 0;

  if (available > 0) {
    return (
      <section className="b365-spin-card is-ready" aria-label="Spin and win">
        <img src={wheelImage} alt="" className="b365-spin-card__wheel" draggable={false} />
        <div className="b365-spin-card__text">
          <p className="b365-spin-card__title">You have {spinsLabel(available)} ready</p>
          <p className="b365-spin-card__sub">Spin to win up to {prize} cash</p>
        </div>
        <Link to="/spin" className="b365-spin-card__cta">
          Spin now
        </Link>
      </section>
    );
  }

  if (phase === 'claim') return null;

  const live = phase === 'live';
  const next = nextTier(player?.deposited ?? 0);
  if (live && player && !next) return null;

  const depositCta = onDeposit ? (
    <button type="button" className="b365-spin-card__cta" onClick={onDeposit}>
      Deposit
    </button>
  ) : (
    <Link to={player ? '/wallet' : '/spin'} className="b365-spin-card__cta">
      {player ? 'Deposit' : 'See prizes'}
    </Link>
  );

  return (
    <section className={`b365-spin-card${live ? ' is-live' : ''}`} aria-label="Spin and win">
      <img src={wheelImage} alt="" className="b365-spin-card__wheel" draggable={false} />
      <div className="b365-spin-card__text">
        <p className="b365-spin-card__badge">
          {live ? (
            <>
              <span className="b365-spin-card__dot" aria-hidden /> Live · ends in{' '}
              <b>{formatCountdown(Date.parse(event.endsAt) - now)}</b>
            </>
          ) : (
            <>
              {formatEventTime(event.startsAt)}–{formatEventTime(event.endsAt)} · starts in{' '}
              <b>{formatCountdown(Date.parse(event.startsAt) - now)}</b>
            </>
          )}
        </p>
        <p className="b365-spin-card__title">Spin &amp; win up to {prize}</p>
        <p className="b365-spin-card__sub">
          {live && next && (player?.deposited ?? 0) > 0
            ? `Deposit ${formatWhole(next.remaining)} ETB more to earn spin #${next.spins}`
            : 'Deposit 100 ETB or more during the hour to earn up to 3 spins'}
        </p>
      </div>
      {live ? depositCta : null}
    </section>
  );
}
