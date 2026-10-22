import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FreeBetInfo } from '../wallet/walletApi';
import { formatTimeLeft, isFreeBetUsable } from './freeBetRules';

const SEEN_KEY_PREFIX = 'superbet_free_bet_welcome_seen:';

function hasSeen(username: string): boolean {
  try {
    return localStorage.getItem(SEEN_KEY_PREFIX + username) === '1';
  } catch {
    return false;
  }
}

function markSeen(username: string) {
  try {
    localStorage.setItem(SEEN_KEY_PREFIX + username, '1');
  } catch {
    /* ignore quota / private mode */
  }
}

type Props = {
  username: string | null;
  freeBet: FreeBetInfo | null | undefined;
  currency: string;
};

/** One-time popup telling a new user about their welcome free bet. */
export default function FreeBetWelcome({ username, freeBet, currency }: Props) {
  const navigate = useNavigate();
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  if (!username || !freeBet || dismissedFor === username || !isFreeBetUsable(freeBet) || hasSeen(username)) {
    return null;
  }

  const close = () => {
    markSeen(username);
    setDismissedFor(username);
  };
  const { rules } = freeBet;

  return (
    <div className="b365-gaw-modal-backdrop" role="presentation" onClick={close}>
      <div
        className="b365-gaw-modal b365-freebet-welcome"
        role="dialog"
        aria-modal="true"
        aria-labelledby="b365-freebet-welcome-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="b365-gaw-modal__close" aria-label="Close" onClick={close}>
          ×
        </button>
        <p className="b365-freebet-welcome__gift" aria-hidden="true">
          🎁
        </p>
        <h2 id="b365-freebet-welcome-title" className="b365-freebet-welcome__title">
          You got a {currency} {freeBet.amount.toFixed(0)} free bet!
        </h2>
        <p className="b365-freebet-welcome__lead">
          Build a sports accumulator and win up to {currency} {rules.maxWin.toLocaleString('en-US')}.
        </p>
        <ul className="b365-freebet-welcome__rules">
          <li>Pick {rules.minLegs}+ pre-match games, each at {rules.minLegOdds.toFixed(2)}+ odds</li>
          <li>Total odds of {rules.minTotalOdds} or more</li>
          <li>Switch on “Use free bet” in your bet slip</li>
          <li>Stake not returned · Deposit {currency} {rules.unlockDeposit} to withdraw winnings</li>
          <li>Expires in {formatTimeLeft(freeBet.expiresAt)} · Sports only, 18+</li>
        </ul>
        <button
          type="button"
          className="b365-btn-primary b365-freebet-welcome__cta"
          onClick={() => {
            close();
            navigate('/');
          }}
        >
          Start picking games
        </button>
      </div>
    </div>
  );
}
