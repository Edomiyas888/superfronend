import { Link } from 'react-router-dom';
import type { KenoFreeTickets } from './walletApi';
import { formatTimeLeft } from '../freeBet/freeBetRules';

type Props = {
  tickets: KenoFreeTickets | null | undefined;
};

/** Wallet banner for free Fast Keno tickets; renders nothing when there are none. */
export default function KenoFreeTicketsCard({ tickets }: Props) {
  if (!tickets) return null;
  return (
    <section className="b365-freebet-card" aria-label="Free Keno tickets">
      <div className="b365-freebet-card__row">
        <span className="b365-freebet-card__icon">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
            <path
              d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M14 6v12" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
          </svg>
        </span>
        <div className="b365-freebet-card__text">
          <p className="b365-freebet-card__title">
            {tickets.count} free Keno ticket{tickets.count === 1 ? '' : 's'}
          </p>
          <p className="b365-freebet-card__sub">
            {tickets.stake} ETB each · expire in {formatTimeLeft(tickets.expiresAt)}
          </p>
        </div>
        <Link to="/keno" className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--sm">
          Play
        </Link>
      </div>
      <details className="b365-freebet-card__rules">
        <summary>How it works</summary>
        <ul>
          <li>In Fast Keno, pick your numbers and keep “Free ticket” switched on</li>
          <li>Each ticket is a {tickets.stake} ETB bet paid by us, not your balance</li>
          <li>Wins pay without the stake and must be bet once before you can withdraw them</li>
        </ul>
      </details>
    </section>
  );
}
