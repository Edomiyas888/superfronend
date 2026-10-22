import { useEffect, useMemo, useState } from 'react';
import {
  fetchDepositRequests,
  fetchTelebirrDepositInfo,
  submitTelebirrDepositRef,
  submitTelebirrDepositScreenshot,
  type DepositRequestRow,
  type TelebirrDepositInfo,
  type TelebirrDepositSubmitResult,
} from './walletApi';
import { MIN_DEPOSIT } from '../../config/bettingLimits';
import { formatMoney } from './transactionLabels';
import { CheckIcon, CopyIcon, UploadIcon } from './WalletIcons';

type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: 'Amount' },
  { n: 2, label: 'Pay' },
  { n: 3, label: 'Confirm' },
];

const QUICK_AMOUNTS = [...new Set([MIN_DEPOSIT, 100, 200, 500, 1000])]
  .filter((n) => n >= MIN_DEPOSIT)
  .sort((a, b) => a - b)
  .slice(0, 5);
type ProofTab = 'screenshot' | 'ref';

type Props = {
  authHeaders: Record<string, string>;
  currency: string;
  onSuccess?: () => void;
};

function parseAmountInput(raw: string): number | null {
  const n = Number.parseFloat(raw.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100) / 100;
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function formatStatus(status: DepositRequestRow['status']) {
  if (status === 'pending') return 'Pending review';
  if (status === 'approved') return 'Approved';
  return 'Rejected';
}

export default function TelebirrDepositFlow({ authHeaders, currency, onSuccess }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [proofTab, setProofTab] = useState<ProofTab>('screenshot');
  const [info, setInfo] = useState<TelebirrDepositInfo | null>(null);
  const [infoErr, setInfoErr] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [refInput, setRefInput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TelebirrDepositSubmitResult | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DepositRequestRow[]>([]);
  const [copiedField, setCopiedField] = useState<'phone' | 'name' | null>(null);

  const amount = useMemo(() => parseAmountInput(amountInput), [amountInput]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setInfoErr(null);
      try {
        const data = await fetchTelebirrDepositInfo(authHeaders);
        if (!cancelled) setInfo(data);
      } catch (err) {
        if (!cancelled) {
          setInfoErr(err instanceof Error ? err.message : 'Could not load Telebirr info.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeaders]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchDepositRequests(authHeaders, { limit: 5 });
        if (!cancelled) setPendingRequests(data.items);
      } catch {
        if (!cancelled) setPendingRequests([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHeaders, success]);

  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshot);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshot]);

  const resetFlow = () => {
    setStep(1);
    setAmountInput('');
    setScreenshot(null);
    setRefInput('');
    setProofTab('screenshot');
    setError(null);
    setSuccess(null);
  };

  const onCopy = async (field: 'phone' | 'name', value: string) => {
    const ok = await copyText(value);
    if (ok) {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    }
  };

  const goToPayStep = () => {
    setError(null);
    if (amount == null) {
      setError('Enter a positive amount.');
      return;
    }
    if (amount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ${MIN_DEPOSIT}.`);
      return;
    }
    setStep(2);
  };

  const goToProofStep = () => {
    setError(null);
    setStep(3);
  };

  const onSubmit = async () => {
    setError(null);
    if (amount == null) {
      setError('Enter a positive amount.');
      return;
    }
    if (amount < MIN_DEPOSIT) {
      setError(`Minimum deposit is ${MIN_DEPOSIT}.`);
      return;
    }

    setBusy(true);
    try {
      let result: TelebirrDepositSubmitResult;
      if (proofTab === 'ref') {
        const ref = refInput.trim();
        if (!ref) {
          setError('Enter your Telebirr transaction reference or receipt URL.');
          return;
        }
        result = await submitTelebirrDepositRef(authHeaders, { amount, ref });
      } else {
        if (!screenshot) {
          setError('Upload a screenshot of your Telebirr success screen.');
          return;
        }
        result = await submitTelebirrDepositScreenshot(authHeaders, { amount, screenshot });
      }
      setSuccess(result);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telebirr deposit submission failed.');
    } finally {
      setBusy(false);
    }
  };

  const payeeName = info?.recipientName ?? 'user user';
  const payeePhone = info?.recipientPhone ?? '0912345678';

  if (success) {
    return (
      <div className="b365-wallet-result">
        <span className="b365-wallet-result__icon">
          <CheckIcon size={28} />
        </span>
        <p className="b365-wallet-result__title">Deposit submitted</p>
        <p className="b365-wallet-result__amount">
          {formatMoney(success.amount)} {success.currency}
        </p>
        <p className="b365-wallet-result__text">
          We&apos;re reviewing your payment and will credit your wallet once it&apos;s approved.
        </p>
        <dl className="b365-wallet-receipt">
          <div>
            <dt>Request ID</dt>
            <dd>{success.id}</dd>
          </div>
          {success.telebirrRef ? (
            <div>
              <dt>Transaction no.</dt>
              <dd>{success.telebirrRef}</dd>
            </div>
          ) : null}
          <div>
            <dt>Status</dt>
            <dd>
              <span className="b365-wallet-status b365-wallet-status--pending">Pending review</span>
            </dd>
          </div>
        </dl>
        <button type="button" className="b365-wallet-btn b365-wallet-btn--ghost" onClick={resetFlow}>
          Make another deposit
        </button>
      </div>
    );
  }

  const copyButton = (field: 'phone' | 'name', value: string) => (
    <button
      type="button"
      className={`b365-wallet-copy${copiedField === field ? ' is-copied' : ''}`}
      onClick={() => void onCopy(field, value)}
      aria-label={`Copy ${field === 'phone' ? 'Telebirr number' : 'recipient name'}`}
    >
      {copiedField === field ? <CheckIcon size={15} /> : <CopyIcon size={15} />}
      {copiedField === field ? 'Copied' : 'Copy'}
    </button>
  );

  return (
    <div className="b365-telebirr">
      <ol className="b365-wallet-stepper" aria-label="Deposit steps">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className={step > s.n ? 'is-done' : step === s.n ? 'is-current' : ''}
            aria-current={step === s.n ? 'step' : undefined}
          >
            <span className="b365-wallet-stepper__dot">{step > s.n ? <CheckIcon size={13} /> : s.n}</span>
            <span className="b365-wallet-stepper__label">{s.label}</span>
          </li>
        ))}
      </ol>

      {infoErr ? <p className="b365-wallet-form__error">{infoErr}</p> : null}

      {step === 1 ? (
        <form
          key="step-1"
          className="b365-wallet-form b365-wallet-step"
          onSubmit={(e) => {
            e.preventDefault();
            goToPayStep();
          }}
          noValidate
        >
          <label className="b365-wallet-field">
            <span className="b365-wallet-field__label">How much do you want to deposit?</span>
            <span className="b365-wallet-amount-input b365-wallet-amount-input--lg">
              <input
                type="number"
                inputMode="decimal"
                min={MIN_DEPOSIT}
                step={0.01}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                disabled={busy}
                placeholder="0.00"
              />
              <span className="b365-wallet-amount-input__currency">{currency}</span>
            </span>
          </label>
          <div className="b365-wallet-chips b365-wallet-chips--amounts" role="group" aria-label="Quick amounts">
            {QUICK_AMOUNTS.map((n) => (
              <button
                key={n}
                type="button"
                className={amount === n ? 'active' : ''}
                aria-pressed={amount === n}
                onClick={() => setAmountInput(String(n))}
              >
                {n.toLocaleString('en-US')}
              </button>
            ))}
          </div>
          <p className="b365-wallet-field__hint">
            Minimum {MIN_DEPOSIT} {currency} · Paid with Telebirr · Credited after a quick review
          </p>
          <button
            type="submit"
            className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--block"
            disabled={busy || amount == null}
          >
            Continue
          </button>
        </form>
      ) : null}

      {step === 2 ? (
        <div key="step-2" className="b365-wallet-step">
          <div className="b365-wallet-send">
            <span>Send exactly</span>
            <strong>
              {formatMoney(amount ?? 0)} <small>{currency}</small>
            </strong>
            <span>via Telebirr to</span>
          </div>

          <dl className="b365-wallet-payee">
            <div className="b365-wallet-payee__row">
              <div>
                <dt>Telebirr number</dt>
                <dd className="b365-wallet-payee__phone">{payeePhone}</dd>
              </div>
              {copyButton('phone', payeePhone)}
            </div>
            <div className="b365-wallet-payee__row">
              <div>
                <dt>Recipient name</dt>
                <dd>{payeeName}</dd>
              </div>
              {copyButton('name', payeeName)}
            </div>
          </dl>

          <ol className="b365-wallet-howto">
            {(info?.instructions?.length ? info.instructions : [
              'Open the Telebirr app',
              'Choose Transfer Money',
              'Paste the recipient number and send the exact amount',
              'Come back here and confirm your payment',
            ]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>

          <div className="b365-wallet-actions">
            <button type="button" className="b365-wallet-btn b365-wallet-btn--ghost" disabled={busy} onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="b365-wallet-btn b365-wallet-btn--primary" disabled={busy} onClick={goToProofStep}>
              I&apos;ve paid
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div key="step-3" className="b365-wallet-step">
          <p className="b365-wallet-step__lead">
            Show us your payment of <strong>{formatMoney(amount ?? 0)} {currency}</strong>
          </p>
          <div className="b365-wallet-chips b365-wallet-chips--toggle" role="tablist" aria-label="Proof type">
            <button
              type="button"
              role="tab"
              aria-selected={proofTab === 'screenshot'}
              className={proofTab === 'screenshot' ? 'active' : ''}
              disabled={busy}
              onClick={() => setProofTab('screenshot')}
            >
              Screenshot
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={proofTab === 'ref'}
              className={proofTab === 'ref' ? 'active' : ''}
              disabled={busy}
              onClick={() => setProofTab('ref')}
            >
              Transaction no.
            </button>
          </div>

          {proofTab === 'screenshot' ? (
            <label className={`b365-wallet-drop${previewUrl ? ' has-file' : ''}`}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy}
                onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              />
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Receipt preview" className="b365-wallet-drop__preview" />
                  <span className="b365-wallet-drop__change">Tap to change</span>
                </>
              ) : (
                <>
                  <span className="b365-wallet-drop__icon">
                    <UploadIcon size={22} />
                  </span>
                  <span className="b365-wallet-drop__title">Upload Telebirr screenshot</span>
                  <span className="b365-wallet-drop__hint">
                    It should show “Successful”, the amount, recipient and transaction number.
                  </span>
                </>
              )}
            </label>
          ) : (
            <label className="b365-wallet-field">
              <span className="b365-wallet-field__label">Transaction number</span>
              <input
                type="text"
                className="b365-wallet-input"
                value={refInput}
                disabled={busy}
                autoCapitalize="characters"
                placeholder="e.g. CJT4XXXXXX or receipt link"
                onChange={(e) => setRefInput(e.target.value)}
              />
              <span className="b365-wallet-field__hint">
                Find it on your Telebirr success screen or SMS, or paste the receipt link.
              </span>
            </label>
          )}

          <div className="b365-wallet-actions">
            <button type="button" className="b365-wallet-btn b365-wallet-btn--ghost" disabled={busy} onClick={() => setStep(2)}>
              Back
            </button>
            <button
              type="button"
              className="b365-wallet-btn b365-wallet-btn--primary"
              disabled={busy || (proofTab === 'ref' ? !refInput.trim() : !screenshot)}
              onClick={() => void onSubmit()}
            >
              {busy ? 'Submitting…' : 'Submit deposit'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="b365-wallet-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {pendingRequests.length > 0 ? (
        <section className="b365-wallet-requests">
          <h3>Recent deposit requests</h3>
          <ul>
            {pendingRequests.map((row) => (
              <li key={row.id}>
                <span className="b365-wallet-requests__amount">
                  {formatMoney(row.amount)} {currency}
                </span>
                <span className={`b365-wallet-status b365-wallet-status--${row.status}`}>
                  {formatStatus(row.status)}
                </span>
                {row.rejectReason ? <span className="b365-wallet-requests__reason">{row.rejectReason}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
