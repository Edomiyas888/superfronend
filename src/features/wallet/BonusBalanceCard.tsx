import { useNow } from '../promo/HappyHourCard';
import type { PromoBonus } from './walletApi';
import { GiftIcon } from './WalletIcons';
import { formatMoney } from './transactionLabels';

/** "5h 20m" / "12m" / "under a minute". */
function timeLeft(ms: number) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return 'under a minute';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

type Props = {
  promo: PromoBonus | null;
  currency: string;
};

/** Cash bonus and its play-through progress; renders nothing when there is no bonus running. */
export default function BonusBalanceCard({ promo, currency }: Props) {
  const expiresAt = promo?.expiresAt ? Date.parse(promo.expiresAt) : 0;
  const now = useNow(expiresAt);
  if (!promo || (promo.balance <= 0 && promo.wagerRemaining <= 0)) return null;

  const pct = promo.wagerTotal > 0 ? Math.min(100, Math.round((promo.wagered / promo.wagerTotal) * 100)) : 0;
  const odds = promo.minOdds.toFixed(2);

  return (
    <section className="b365-freebet-card b365-bonus-card" aria-label="Bonus balance">
      <div className="b365-freebet-card__row">
        <span className="b365-freebet-card__icon">
          <GiftIcon size={20} />
        </span>
        <div className="b365-freebet-card__text">
          <p className="b365-freebet-card__title">
            Bonus balance · {currency} {formatMoney(promo.balance)}
          </p>
          <p className="b365-freebet-card__sub">
            Bet {currency} {formatMoney(promo.wagerRemaining)} more at total odds above {odds} to unlock it as cash
            {expiresAt ? (
              <>
                {' '}
                · <b>{expiresAt > now ? `expires in ${timeLeft(expiresAt - now)}` : 'expired'}</b>
              </>
            ) : null}
          </p>
        </div>
      </div>

      <div
        className="b365-bonus-card__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label="Bonus play-through progress"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="b365-bonus-card__progress">
        {formatMoney(promo.wagered)} / {formatMoney(promo.wagerTotal)} wagered · {pct}%
      </p>

      <details className="b365-freebet-card__rules">
        <summary>How it works</summary>
        <ul>
          <li>Your bonus can&apos;t be used to place bets until it is unlocked as cash</li>
          <li>Bets you place with cash at total odds above {odds} count toward unlocking it</li>
          <li>While your bonus is running, you can bet on only one outcome of each match</li>
          <li>
            Bet {currency} {formatMoney(promo.wagerTotal)} in total and your bonus becomes withdrawable cash
          </li>
          {expiresAt ? (
            <li>Not unlocked in time? The bonus, and what it won, expires. A new bonus restarts the clock</li>
          ) : null}
        </ul>
      </details>
    </section>
  );
}
