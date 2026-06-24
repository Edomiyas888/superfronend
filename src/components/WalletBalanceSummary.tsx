import { Link } from 'react-router-dom';

type Props = {
  balance: number | null;
  withdrawable: number | null;
  nonWithdrawable: number | null;
  currency: string;
  loading?: boolean;
  variant?: 'sidebar' | 'drawer';
};

export default function WalletBalanceSummary({
  balance,
  withdrawable,
  nonWithdrawable,
  currency,
  loading = false,
  variant = 'sidebar',
}: Props) {
  if (loading) {
    return (
      <div className={`b365-wallet-summary b365-wallet-summary--${variant}`}>
        <span className="b365-muted">Loading balance…</span>
      </div>
    );
  }

  if (balance == null || withdrawable == null || nonWithdrawable == null) {
    return null;
  }

  return (
    <Link to="/wallet" className={`b365-wallet-summary b365-wallet-summary--${variant}`}>
      <div className="b365-wallet-summary__head">
        <span className="b365-wallet-summary__label">Balance</span>
        <span className="b365-wallet-summary__total">
          {balance.toFixed(2)} {currency}
        </span>
      </div>
      <div className="b365-wallet-summary__rows">
        <div className="b365-wallet-summary__row">
          <span>Withdrawable</span>
          <strong>{withdrawable.toFixed(2)}</strong>
        </div>
        {nonWithdrawable > 0 ? (
          <div className="b365-wallet-summary__row b365-wallet-summary__row--locked">
            <span>Non-withdrawable</span>
            <strong>{nonWithdrawable.toFixed(2)}</strong>
          </div>
        ) : null}
      </div>
    </Link>
  );
}
