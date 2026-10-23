import { formatMoney } from './transactionLabels';
import { RefreshIcon } from './WalletIcons';

type Props = {
  currency: string;
  /** `null` while loading or when the balance could not be fetched. */
  balance: number | null;
  withdrawable: number | null;
  nonWithdrawable: number | null;
  bonusBalance: number;
  /** Cash bonus — part of the total, shown on its own because it is never withdrawable. */
  promoBalance: number;
  loading: boolean;
  error: boolean;
  refreshing: boolean;
  onRefresh: () => void;
};

export default function WalletBalanceCard({
  currency,
  balance,
  withdrawable,
  nonWithdrawable,
  bonusBalance,
  promoBalance,
  loading,
  error,
  refreshing,
  onRefresh,
}: Props) {
  return (
    <section className="b365-wallet-balance" aria-label="Wallet balance" aria-busy={loading}>
      <div className="b365-wallet-balance__top">
        <span className="b365-wallet-balance__label">Total balance</span>
        <button
          type="button"
          className={`b365-wallet-balance__refresh${refreshing ? ' is-spinning' : ''}`}
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh balance"
        >
          <RefreshIcon size={16} />
        </button>
      </div>

      {loading ? (
        <div className="b365-wallet-skeleton b365-wallet-skeleton--amount" />
      ) : error || balance == null ? (
        <p className="b365-wallet-balance__error">
          Couldn&apos;t load your balance.{' '}
          <button type="button" onClick={onRefresh}>
            Try again
          </button>
        </p>
      ) : (
        <p className="b365-wallet-balance__amount">
          {formatMoney(balance)}
          <span>{currency}</span>
        </p>
      )}

      {withdrawable != null && nonWithdrawable != null ? (
        <dl className="b365-wallet-balance__split">
          <div className="b365-wallet-stat b365-wallet-stat--ok">
            <dt>Withdrawable</dt>
            <dd>{formatMoney(withdrawable)}</dd>
          </div>
          <div className="b365-wallet-stat">
            <dt>To play through</dt>
            <dd>{formatMoney(nonWithdrawable)}</dd>
          </div>
          {promoBalance > 0 ? (
            <div className="b365-wallet-stat b365-wallet-stat--bonus">
              <dt>Bonus</dt>
              <dd>{formatMoney(promoBalance)}</dd>
            </div>
          ) : null}
          {bonusBalance > 0 ? (
            <div className="b365-wallet-stat b365-wallet-stat--bonus">
              <dt>Free bet</dt>
              <dd>{formatMoney(bonusBalance)}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </section>
  );
}
