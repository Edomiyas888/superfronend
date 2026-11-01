import { Link } from 'react-router-dom';
import wheelImage from '../../assets/home-spin.webp';
import { spinPhase, useNowTick, useSpinStatus } from './spinApi';
import { GRAND_PRIZE, SPIN_TIERS, formatCountdown, formatWhole, nextTier, spinsLabel } from './spinRules';

type Props = {
  /** On the wallet page the deposit form is already here — switch to it instead of navigating. */
  onDeposit?: () => void;
};

/**
 * Home and wallet banner for the daily Spin & Win: spins ready to use, else the next free spin
 * to earn today, else (all earned) a spin to buy. Hidden when the API has no Spin & Win.
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

  // Today's free spins are all earned and used: offer one to buy.
  if (player && !next) {
    return (
      <section className="b365-spin-card" aria-label="Spin and win">
        <img src={wheelImage} alt="" className="b365-spin-card__wheel" draggable={false} />
        <div className="b365-spin-card__text">
          <p className="b365-spin-card__title">Buy a spin for {status.price} ETB</p>
          <p className="b365-spin-card__sub">Win up to {prize} cash</p>
        </div>
        <Link to="/spin" className="b365-spin-card__cta">
          Spin
        </Link>
      </section>
    );
  }

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
          <span className="b365-spin-card__dot" aria-hidden /> Daily · resets in{' '}
          <b>{formatCountdown(Date.parse(event.endsAt) - now)}</b>
        </p>
        <p className="b365-spin-card__title">Spin &amp; win up to {prize}</p>
        <p className="b365-spin-card__sub">
          {live && next && (player?.deposited ?? 0) > 0
            ? `Deposit ${formatWhole(next.remaining)} ETB more today to earn free spin #${next.spins}`
            : `Deposit ${SPIN_TIERS[0].at} ETB or more today for up to 3 free spins`}
        </p>
      </div>
      {live ? depositCta : null}
    </section>
  );
}
