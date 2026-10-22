import { useState } from 'react';
import type { FreeBetInfo } from './walletApi';
import { withdrawWallet } from './walletApi';
import { formatMoney } from './transactionLabels';
import { CheckIcon, InfoIcon, LockIcon } from './WalletIcons';

type Props = {
  authHeaders: Record<string, string>;
  currency: string;
  withdrawable: number | null;
  nonWithdrawable: number | null;
  freeBet: FreeBetInfo | null | undefined;
  defaultPhone: string | null;
  onDeposit: () => void;
  onSuccess: () => Promise<void> | void;
};

const PHONE_RE = /^(?:\+?251|0)?[79]\d{8}$/;

function parseAmount(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

export default function WithdrawPanel({
  authHeaders,
  currency,
  withdrawable,
  nonWithdrawable,
  freeBet,
  defaultPhone,
  onDeposit,
  onSuccess,
}: Props) {
  const [amountInput, setAmountInput] = useState('');
  const [phone, setPhone] = useState(defaultPhone ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ message: string; amount: number } | null>(null);

  const amount = parseAmount(amountInput);
  const available = withdrawable ?? 0;
  const overLimit = amount != null && amount > available;
  const phoneTrimmed = phone.replace(/\s+/g, '');
  const phoneInvalid = phoneTrimmed.length > 0 && !PHONE_RE.test(phoneTrimmed);

  if (freeBet?.winningsLocked) {
    return (
      <div className="b365-wallet-notice b365-wallet-notice--warn">
        <span className="b365-wallet-notice__icon">
          <LockIcon size={20} />
        </span>
        <div>
          <p className="b365-wallet-notice__title">Withdrawals are locked</p>
          <p>
            Deposit at least {freeBet.rules.unlockDeposit} {currency} to unlock withdrawal of your free bet
            winnings.
          </p>
          <button type="button" className="b365-wallet-btn b365-wallet-btn--primary" onClick={onDeposit}>
            Deposit {freeBet.rules.unlockDeposit} {currency}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="b365-wallet-result">
        <span className="b365-wallet-result__icon">
          <CheckIcon size={28} />
        </span>
        <p className="b365-wallet-result__title">Withdrawal requested</p>
        <p className="b365-wallet-result__amount">
          {formatMoney(success.amount)} {currency}
        </p>
        <p className="b365-wallet-result__text">{success.message}</p>
        <button
          type="button"
          className="b365-wallet-btn b365-wallet-btn--ghost"
          onClick={() => setSuccess(null)}
        >
          Done
        </button>
      </div>
    );
  }

  if (withdrawable != null && withdrawable <= 0) {
    return (
      <div className="b365-wallet-notice">
        <span className="b365-wallet-notice__icon">
          <InfoIcon size={20} />
        </span>
        <div>
          <p className="b365-wallet-notice__title">Nothing to withdraw yet</p>
          <p>
            Only winnings can be withdrawn.
            {nonWithdrawable != null && nonWithdrawable > 0
              ? ` Play through your ${formatMoney(nonWithdrawable)} ${currency} deposit — winnings become withdrawable once your bets settle.`
              : ' Winnings become withdrawable once your bets settle.'}
          </p>
        </div>
      </div>
    );
  }

  const onSubmit = async () => {
    setError(null);
    if (amount == null) {
      setError('Enter an amount to withdraw.');
      return;
    }
    if (overLimit) {
      setError(`You can withdraw up to ${formatMoney(available)} ${currency}.`);
      return;
    }
    if (phoneInvalid) {
      setError('Enter a valid Telebirr number, e.g. 0912345678.');
      return;
    }
    setBusy(true);
    try {
      const result = await withdrawWallet(authHeaders, {
        amount,
        telebirrPhone: phoneTrimmed || undefined,
      });
      setAmountInput('');
      setSuccess({ message: result.message, amount });
      await onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Withdrawal failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="b365-wallet-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
      noValidate
    >
      <div className="b365-wallet-available">
        <span>Available to withdraw</span>
        <strong>
          {formatMoney(available)} {currency}
        </strong>
      </div>

      <label className="b365-wallet-field">
        <span className="b365-wallet-field__label">Amount</span>
        <span className={`b365-wallet-amount-input${overLimit ? ' is-invalid' : ''}`}>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            disabled={busy}
            placeholder="0.00"
            aria-invalid={overLimit}
          />
          <span className="b365-wallet-amount-input__currency">{currency}</span>
          <button
            type="button"
            className="b365-wallet-amount-input__max"
            onClick={() => setAmountInput(String(available))}
            disabled={busy}
          >
            Max
          </button>
        </span>
        {overLimit ? (
          <span className="b365-wallet-field__error">
            Max {formatMoney(available)} {currency}
          </span>
        ) : null}
      </label>

      <label className="b365-wallet-field">
        <span className="b365-wallet-field__label">Telebirr number</span>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          className={`b365-wallet-input${phoneInvalid ? ' is-invalid' : ''}`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={busy}
          placeholder="09xxxxxxxx"
          aria-invalid={phoneInvalid}
        />
        <span className="b365-wallet-field__hint">Money is sent to this Telebirr account.</span>
      </label>

      {error ? (
        <p className="b365-wallet-form__error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--block"
        disabled={busy || amount == null || overLimit || phoneInvalid}
      >
        {busy
          ? 'Submitting…'
          : amount != null && !overLimit
            ? `Withdraw ${formatMoney(amount)} ${currency}`
            : 'Withdraw'}
      </button>
    </form>
  );
}
