import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  depositTelebirr,
  fetchTelebirrDepositInfo,
  type TelebirrDepositInfo,
  type TelebirrDepositResult,
} from './walletApi';

type Step = 1 | 2 | 3;

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

export default function TelebirrDepositFlow({ authHeaders, currency, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>(1);
  const [info, setInfo] = useState<TelebirrDepositInfo | null>(null);
  const [infoErr, setInfoErr] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<TelebirrDepositResult | null>(null);
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
    if (!screenshot) {
      setError('Upload a screenshot of your Telebirr success screen.');
      return;
    }

    setBusy(true);
    try {
      const result = await depositTelebirr(authHeaders, {
        amount,
        screenshot,
      });
      setSuccess(result);
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'header'] });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Telebirr deposit failed.');
    } finally {
      setBusy(false);
    }
  };

  const payeeName = info?.recipientName ?? 'edoimas Tariku';
  const payeePhone = info?.recipientPhone ?? '0935616694';

  if (success) {
    return (
      <div className="b365-telebirr-flow">
        <div className="b365-telebirr-success">
          <h3 className="b365-telebirr-success-title">Deposit successful</h3>
          <p>
            <strong>{success.deposited.toFixed(2)}</strong> {success.currency} credited to your wallet.
          </p>
          <dl className="b365-telebirr-receipt-dl">
            <div>
              <dt>Transaction no.</dt>
              <dd>{success.telebirrRef}</dd>
            </div>
            <div>
              <dt>New balance</dt>
              <dd>
                {success.balance.toFixed(2)} {success.currency}
              </dd>
            </div>
            {success.verified.paidAt ? (
              <div>
                <dt>Paid at</dt>
                <dd>{success.verified.paidAt}</dd>
              </div>
            ) : null}
          </dl>
          <button type="button" className="b365-btn-secondary" onClick={resetFlow}>
            Make another deposit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="b365-telebirr-flow">
      <div className="b365-telebirr-steps" aria-label="Deposit steps">
        <span className={step >= 1 ? 'active' : ''}>1. Amount</span>
        <span className={step >= 2 ? 'active' : ''}>2. Pay</span>
        <span className={step >= 3 ? 'active' : ''}>3. Upload</span>
      </div>

      <p className="b365-muted b365-telebirr-note">
        Deposits are verified from your Telebirr success screenshot only.
      </p>
      {infoErr ? <p className="b365-error">{infoErr}</p> : null}

      {step === 1 ? (
        <div key="step-1" className="b365-telebirr-panel b365-telebirr-panel--enter">
          <label className="b365-field-label">
            Deposit amount ({currency})
            <input
              type="number"
              className="b365-input"
              min={0}
              step={0.01}
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              disabled={busy}
              placeholder="e.g. 100"
            />
          </label>
          <button type="button" className="b365-btn-primary" disabled={busy} onClick={goToPayStep}>
            Continue
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div key="step-2" className="b365-telebirr-panel b365-telebirr-panel--enter">
          <p className="b365-telebirr-amount-reminder">
            Send exactly <strong>{amount?.toFixed(2)}</strong> {currency} via Telebirr.
          </p>

          <div className="b365-telebirr-payee">
            <div className="b365-telebirr-payee-row">
              <div>
                <span className="b365-muted">Recipient name</span>
                <strong>{payeeName}</strong>
              </div>
              <button
                type="button"
                className={`b365-btn-secondary b365-telebirr-copy${copiedField === 'name' ? ' b365-telebirr-copy--copied' : ''}`}
                onClick={() => void onCopy('name', payeeName)}
              >
                {copiedField === 'name' ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="b365-telebirr-payee-row">
              <div>
                <span className="b365-muted">Telebirr number</span>
                <strong>{payeePhone}</strong>
              </div>
              <button
                type="button"
                className={`b365-btn-secondary b365-telebirr-copy${copiedField === 'phone' ? ' b365-telebirr-copy--copied' : ''}`}
                onClick={() => void onCopy('phone', payeePhone)}
              >
                {copiedField === 'phone' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <ol className="b365-telebirr-instructions">
            {(info?.instructions?.length ? info.instructions : [
              'Open the Telebirr app',
              'Choose Transfer Money',
              'Paste the recipient number and send the exact amount',
              'Take a screenshot of the success screen before closing it',
            ]).map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>

          <div className="b365-telebirr-actions">
            <button type="button" className="b365-btn-secondary" disabled={busy} onClick={() => setStep(1)}>
              Back
            </button>
            <button type="button" className="b365-btn-primary" disabled={busy} onClick={goToProofStep}>
              I have paid
            </button>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div key="step-3" className="b365-telebirr-panel b365-telebirr-panel--enter">
          <label className="b365-field-label">
            Upload Telebirr success screenshot
            <input
              type="file"
              className="b365-input b365-file-input"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
            />
            {previewUrl ? (
              <img src={previewUrl} alt="Receipt preview" className="b365-telebirr-preview" />
            ) : null}
          </label>
          <p className="b365-muted b365-telebirr-upload-hint">
            Make sure the screenshot shows Successful, amount, recipient, and transaction number.
          </p>

          <div className="b365-telebirr-actions">
            <button type="button" className="b365-btn-secondary" disabled={busy} onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="b365-btn-primary" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? 'Verifying…' : 'Verify & deposit'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="b365-error">{error}</p> : null}
    </div>
  );
}
