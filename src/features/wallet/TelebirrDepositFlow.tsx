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

type Step = 1 | 2 | 3;
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

  const payeeName = info?.recipientName ?? 'edoimas Tariku';
  const payeePhone = info?.recipientPhone ?? '0935616694';

  if (success) {
    return (
      <div className="b365-telebirr-flow">
        <div className="b365-telebirr-success">
          <h3 className="b365-telebirr-success-title">Deposit submitted</h3>
          <p>
            Your request for <strong>{success.amount.toFixed(2)}</strong> {success.currency} is pending
            manual review. We will credit your wallet after approval.
          </p>
          <dl className="b365-telebirr-receipt-dl">
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
              <dd>Pending review</dd>
            </div>
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
        <span className={step >= 3 ? 'active' : ''}>3. Submit proof</span>
      </div>

      <p className="b365-muted b365-telebirr-note">
        Submit your transaction reference or screenshot. Deposits are credited after manual approval.
      </p>
      {infoErr ? <p className="b365-error">{infoErr}</p> : null}

      {pendingRequests.length > 0 ? (
        <div className="b365-telebirr-pending-list">
          <h4 className="b365-telebirr-pending-title">Recent deposit requests</h4>
          <ul>
            {pendingRequests.map((row) => (
              <li key={row.id}>
                <span>{row.amount.toFixed(2)} {currency}</span>
                <span className={`b365-telebirr-status b365-telebirr-status--${row.status}`}>
                  {formatStatus(row.status)}
                </span>
                {row.rejectReason ? (
                  <span className="b365-muted"> — {row.rejectReason}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

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
              'Submit your transaction reference or upload a screenshot',
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
          <div className="b365-telebirr-proof-tabs" role="tablist" aria-label="Proof type">
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
              Reference
            </button>
          </div>

          {proofTab === 'screenshot' ? (
            <>
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
            </>
          ) : (
            <label className="b365-field-label">
              Transaction reference
              <input
                type="text"
                className="b365-input"
                value={refInput}
                disabled={busy}
                placeholder="10-character code or receipt URL"
                onChange={(e) => setRefInput(e.target.value)}
              />
              <p className="b365-muted b365-telebirr-upload-hint">
                Copy the transaction number from your Telebirr success screen or paste the receipt link.
              </p>
            </label>
          )}

          <div className="b365-telebirr-actions">
            <button type="button" className="b365-btn-secondary" disabled={busy} onClick={() => setStep(2)}>
              Back
            </button>
            <button type="button" className="b365-btn-primary" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
        </div>
      ) : null}

      {error ? <p className="b365-error">{error}</p> : null}
    </div>
  );
}
