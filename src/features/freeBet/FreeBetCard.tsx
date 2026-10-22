import { Link } from 'react-router-dom';
import type { FreeBetInfo } from '../wallet/walletApi';
import { GiftIcon } from '../wallet/WalletIcons';
import { formatTimeLeft, isFreeBetUsable } from './freeBetRules';

type Props = {
  freeBet: FreeBetInfo | null | undefined;
  currency: string;
  onDeposit?: () => void;
};

/** Wallet page banner for the welcome free bet; renders nothing once it no longer matters. */
export default function FreeBetCard({ freeBet, currency, onDeposit }: Props) {
  if (!freeBet) return null;
  const { rules } = freeBet;

  if (isFreeBetUsable(freeBet)) {
    return (
      <section className="b365-freebet-card" aria-label="Free bet">
        <div className="b365-freebet-card__row">
          <span className="b365-freebet-card__icon">
            <GiftIcon size={20} />
          </span>
          <div className="b365-freebet-card__text">
            <p className="b365-freebet-card__title">
              {currency} {freeBet.amount.toFixed(0)} free bet
            </p>
            <p className="b365-freebet-card__sub">Expires in {formatTimeLeft(freeBet.expiresAt)}</p>
          </div>
          <Link to="/" className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--sm">
            Use it
          </Link>
        </div>
        <details className="b365-freebet-card__rules">
          <summary>How it works</summary>
          <ul>
            <li>Sports accumulator with {rules.minLegs}+ matches</li>
            <li>Total odds {rules.minTotalOdds}+, every pick {rules.minLegOdds.toFixed(2)}+</li>
            <li>
              Stake not returned · win up to {currency} {rules.maxWin.toLocaleString('en-US')}
            </li>
          </ul>
        </details>
      </section>
    );
  }

  if (freeBet.status === 'placed') {
    return (
      <section className="b365-freebet-card b365-freebet-card--quiet" aria-label="Free bet">
        <div className="b365-freebet-card__row">
          <span className="b365-freebet-card__icon">
            <GiftIcon size={20} />
          </span>
          <p className="b365-freebet-card__sub b365-freebet-card__text">
            Your {currency} {freeBet.amount.toFixed(0)} free bet is running. Check it in{' '}
            <Link to="/my-bets">My Bets</Link>.
          </p>
        </div>
      </section>
    );
  }

  if (freeBet.status === 'won' && freeBet.winningsLocked) {
    return (
      <section className="b365-freebet-card b365-freebet-card--won" aria-label="Free bet winnings">
        <div className="b365-freebet-card__row">
          <span className="b365-freebet-card__icon">
            <GiftIcon size={20} />
          </span>
          <div className="b365-freebet-card__text">
            <p className="b365-freebet-card__title">
              You won {currency} {freeBet.winAmount.toFixed(2)}
            </p>
            <p className="b365-freebet-card__sub">
              Deposit {currency} {rules.unlockDeposit}+ to unlock withdrawal.
            </p>
          </div>
          {onDeposit ? (
            <button
              type="button"
              className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--sm"
              onClick={onDeposit}
            >
              Deposit
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  return null;
}
