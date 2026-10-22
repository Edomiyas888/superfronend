import { Link } from 'react-router-dom';
import type { FreeBetInfo } from '../wallet/walletApi';
import { formatTimeLeft, isFreeBetUsable } from './freeBetRules';

type Props = {
  freeBet: FreeBetInfo | null | undefined;
  currency: string;
  onDeposit?: () => void;
};

/** Wallet page card for the welcome free bet; renders nothing once it no longer matters. */
export default function FreeBetCard({ freeBet, currency, onDeposit }: Props) {
  if (!freeBet) return null;
  const { rules } = freeBet;

  if (isFreeBetUsable(freeBet)) {
    return (
      <section className="b365-freebet-card" aria-label="Free bet">
        <div className="b365-freebet-card__head">
          <span className="b365-freebet-card__tag">Free bet</span>
          <span className="b365-freebet-card__expiry">Expires in {formatTimeLeft(freeBet.expiresAt)}</span>
        </div>
        <p className="b365-freebet-card__amount">
          {currency} {freeBet.amount.toFixed(2)}
        </p>
        <ul className="b365-freebet-card__rules">
          <li>Sports accumulator with {rules.minLegs}+ matches</li>
          <li>Total odds {rules.minTotalOdds}+, every pick {rules.minLegOdds.toFixed(2)}+</li>
          <li>
            Stake not returned · win up to {currency} {rules.maxWin.toLocaleString('en-US')}
          </li>
        </ul>
        <Link to="/" className="b365-btn-primary b365-freebet-card__cta">
          Build my free bet
        </Link>
      </section>
    );
  }

  if (freeBet.status === 'placed') {
    return (
      <section className="b365-freebet-card b365-freebet-card--quiet" aria-label="Free bet">
        <p className="b365-freebet-card__line">
          Your {currency} {freeBet.amount.toFixed(0)} free bet is running. Check it in{' '}
          <Link to="/my-bets">My Bets</Link>.
        </p>
      </section>
    );
  }

  if (freeBet.status === 'won' && freeBet.winningsLocked) {
    return (
      <section className="b365-freebet-card b365-freebet-card--won" aria-label="Free bet winnings">
        <span className="b365-freebet-card__tag">Free bet won</span>
        <p className="b365-freebet-card__amount">
          {currency} {freeBet.winAmount.toFixed(2)}
        </p>
        <p className="b365-freebet-card__line">
          Deposit at least {currency} {rules.unlockDeposit} to unlock withdrawal of your free bet winnings.
        </p>
        {onDeposit ? (
          <button type="button" className="b365-btn-primary b365-freebet-card__cta" onClick={onDeposit}>
            Deposit {currency} {rules.unlockDeposit}
          </button>
        ) : null}
      </section>
    );
  }

  return null;
}
