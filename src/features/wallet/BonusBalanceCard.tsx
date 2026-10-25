import type { PromoBonus } from './walletApi';
import { GiftIcon } from './WalletIcons';
import { formatMoney } from './transactionLabels';

type Props = {
  promo: PromoBonus | null;
  currency: string;
};

/** Cash bonus and its play-through progress; renders nothing when there is no bonus running. */
export default function BonusBalanceCard({ promo, currency }: Props) {
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
          <li>Your bonus is part of your total balance and can be used on sports bets</li>
          <li>Cash is used first; the bonus covers the rest</li>
          <li>Only bets with total odds above {odds} can use the bonus or count toward unlocking it</li>
          <li>While your bonus is running, you can bet on only one outcome of each match</li>
          <li>
            Bet {promo.multiplier}× your bonus in total and whatever is left becomes withdrawable cash
          </li>
          <li>Winnings from bonus money stay in your bonus balance until then</li>
        </ul>
      </details>
    </section>
  );
}
