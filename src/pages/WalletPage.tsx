import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSessionStore } from '../features/auth/sessionStore';
import TelebirrDepositFlow from '../features/wallet/TelebirrDepositFlow';
import {
  fetchBalance,
  fetchWalletTransactions,
  withdrawWallet,
} from '../features/wallet/walletApi';
import {
  txIcon,
  txIsCredit,
  txTypeLabel,
  type WalletHistoryFilter,
} from '../features/wallet/transactionLabels';

type WalletTab = 'deposit' | 'withdraw' | 'history';

const HISTORY_FILTERS: { id: WalletHistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdraw', label: 'Withdrawals' },
  { id: 'bets', label: 'Bets' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: WalletTab =
    tabParam === 'withdraw' || tabParam === 'history' ? tabParam : 'deposit';

  const { username, getAuthHeader } = useSessionStore();
  const queryClient = useQueryClient();
  const loggedIn = !!username;

  const [walletAmount, setWalletAmount] = useState('');
  const [telebirrPhone, setTelebirrPhone] = useState('');
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletErr, setWalletErr] = useState<string | null>(null);
  const [walletSuccess, setWalletSuccess] = useState<string | null>(null);
  const [historyType, setHistoryType] = useState<WalletHistoryFilter>('all');
  const [historyPage, setHistoryPage] = useState(1);

  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(getAuthHeader()),
    enabled: loggedIn,
    staleTime: 30_000,
  });

  const historyQ = useQuery({
    queryKey: ['wallet', 'transactions', historyPage, historyType],
    queryFn: () =>
      fetchWalletTransactions(getAuthHeader(), {
        page: historyPage,
        limit: 20,
        type: historyType === 'all' ? undefined : historyType,
      }),
    enabled: loggedIn,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const currency = walletQ.data?.currency ?? 'ETB';
  const balance =
    walletQ.isPending || walletQ.isError || walletQ.data?.status === 'error'
      ? null
      : Number(walletQ.data?.balance ?? 0);

  const setTab = (next: WalletTab) => {
    setSearchParams(next === 'deposit' ? {} : { tab: next });
    setWalletErr(null);
    setWalletSuccess(null);
  };

  const parseWalletAmount = (): number | null => {
    const n = Number.parseFloat(walletAmount.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
  };

  const invalidateWallet = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet', 'header'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
    ]);
  };

  const onWithdraw = async () => {
    setWalletErr(null);
    setWalletSuccess(null);
    const amt = parseWalletAmount();
    if (amt == null) {
      setWalletErr('Enter a positive amount.');
      return;
    }
    if (balance != null && amt > balance) {
      setWalletErr('Amount exceeds your available balance.');
      return;
    }
    setWalletBusy(true);
    try {
      const result = await withdrawWallet(getAuthHeader(), {
        amount: amt,
        telebirrPhone: telebirrPhone.trim() || undefined,
      });
      setWalletAmount('');
      setWalletSuccess(result.message);
      await invalidateWallet();
    } catch (err) {
      setWalletErr(err instanceof Error ? err.message : 'Withdraw failed.');
    } finally {
      setWalletBusy(false);
    }
  };

  return (
    <div className={`b365-wallet-page${loggedIn ? ' b365-wallet-page--logged-in' : ''}`}>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Wallet</span>
      </div>

      <h1 className="b365-page-title">Wallet</h1>

      {!loggedIn ? (
        <div className="card b365-card b365-wallet-guest">
          <p className="b365-muted" style={{ margin: 0 }}>
            Sign in to deposit, withdraw, and view your transaction history.{' '}
            <Link to="/profile">Log in</Link>
          </p>
        </div>
      ) : (
        <>
          <section className="b365-wallet-hero" aria-label="Wallet balance">
            <div className="b365-wallet-hero__top">
              <span className="b365-wallet-hero__label">Available balance</span>
              <span className="b365-wallet-hero__badge">{currency}</span>
            </div>
            <p className="b365-wallet-hero__amount">
              {balance == null ? '—' : balance.toFixed(2)}
            </p>
            <p className="b365-wallet-hero__hint">
              Deposits via Telebirr · Winnings credited automatically after settlement
            </p>
          </section>

          <nav className="b365-wallet-segments" aria-label="Wallet actions">
            <button
              type="button"
              className={tab === 'deposit' ? 'active' : ''}
              onClick={() => setTab('deposit')}
            >
              Deposit
            </button>
            <button
              type="button"
              className={tab === 'withdraw' ? 'active' : ''}
              onClick={() => setTab('withdraw')}
            >
              Withdraw
            </button>
            <button
              type="button"
              className={tab === 'history' ? 'active' : ''}
              onClick={() => setTab('history')}
            >
              History
              {historyQ.data?.total ? (
                <span className="b365-wallet-segments__count">{historyQ.data.total}</span>
              ) : null}
            </button>
          </nav>

          {tab === 'deposit' ? (
            <section key="deposit" className="card b365-card b365-wallet-panel b365-wallet-panel--enter">
              <header className="b365-wallet-panel__head">
                <h2>Deposit via Telebirr</h2>
                <p>Send money from Telebirr, then verify your payment here.</p>
              </header>
              <TelebirrDepositFlow
                authHeaders={getAuthHeader()}
                currency={currency}
                onSuccess={() => {
                  void invalidateWallet();
                }}
              />
            </section>
          ) : null}

          {tab === 'withdraw' ? (
            <section className="card b365-card b365-wallet-panel">
              <header className="b365-wallet-panel__head">
                <h2>Withdraw</h2>
                <p>Request a withdrawal to your Telebirr account. Balance is reserved until approved.</p>
              </header>
              <label className="b365-field-label">
                Telebirr phone number
                <input
                  type="tel"
                  className="b365-input b365-wallet-input"
                  value={telebirrPhone}
                  onChange={(e) => setTelebirrPhone(e.target.value)}
                  disabled={walletBusy}
                  placeholder="09xxxxxxxx"
                />
              </label>
              <label className="b365-field-label">
                Amount ({currency})
                <input
                  type="number"
                  className="b365-input b365-wallet-input"
                  min={0}
                  step={0.01}
                  max={balance ?? undefined}
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  disabled={walletBusy}
                  placeholder="e.g. 100"
                />
              </label>
              {balance != null ? (
                <button
                  type="button"
                  className="b365-wallet-quick-amt"
                  onClick={() => setWalletAmount(String(balance))}
                  disabled={walletBusy}
                >
                  Withdraw full balance ({balance.toFixed(2)} {currency})
                </button>
              ) : null}
              <div className="b365-wallet-actions">
                <button
                  type="button"
                  className="b365-btn-primary b365-wallet-submit"
                  disabled={walletBusy}
                  onClick={() => void onWithdraw()}
                >
                  {walletBusy ? 'Submitting…' : 'Request withdrawal'}
                </button>
              </div>
              {walletSuccess ? <p className="b365-success">{walletSuccess}</p> : null}
              {walletErr ? <p className="b365-error">{walletErr}</p> : null}
            </section>
          ) : null}

          {tab === 'history' ? (
            <section className="card b365-card b365-wallet-panel">
              <header className="b365-wallet-panel__head">
                <h2>Transaction history</h2>
                <p>Deposits, withdrawals, stakes, wins, and refunds.</p>
              </header>

              <div className="b365-wallet-filter-pills" role="tablist" aria-label="Filter transactions">
                {HISTORY_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="tab"
                    aria-selected={historyType === f.id}
                    className={historyType === f.id ? 'active' : ''}
                    onClick={() => {
                      setHistoryType(f.id);
                      setHistoryPage(1);
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {historyQ.isLoading ? (
                <div className="b365-wallet-history-empty">
                  <p className="b365-muted">Loading transactions…</p>
                </div>
              ) : historyQ.isError ? (
                <div className="b365-wallet-history-empty">
                  <p className="b365-error">{(historyQ.error as Error).message}</p>
                </div>
              ) : (historyQ.data?.items.length ?? 0) === 0 ? (
                <div className="b365-wallet-history-empty">
                  <p className="b365-wallet-history-empty__title">No transactions yet</p>
                  <p className="b365-muted">
                    Deposits, bets, and withdrawals will appear here.
                  </p>
                  <button type="button" className="b365-btn-secondary" onClick={() => setTab('deposit')}>
                    Make a deposit
                  </button>
                </div>
              ) : (
                <ul className="b365-wallet-history-list">
                  {historyQ.data!.items.map((tx) => {
                    const credit = txIsCredit(tx.type);
                    return (
                      <li key={tx.id} className="b365-wallet-history-item">
                        <span
                          className={`b365-wallet-tx-icon ${credit ? 'b365-wallet-tx-icon--credit' : 'b365-wallet-tx-icon--debit'}`}
                          aria-hidden
                        >
                          {txIcon(tx.type)}
                        </span>
                        <div className="b365-wallet-history-body">
                          <div className="b365-wallet-history-main">
                            <span className="b365-wallet-history-type">{txTypeLabel(tx.type)}</span>
                            <strong
                              className={
                                credit ? 'b365-wallet-tx-amount--credit' : 'b365-wallet-tx-amount--debit'
                              }
                            >
                              {credit ? '+' : '−'}
                              {Number(tx.amount).toFixed(2)} {currency}
                            </strong>
                          </div>
                          <div className="b365-wallet-history-meta">
                            <span>{formatDate(tx.createdAt)}</span>
                            <span>Balance {Number(tx.balanceAfter).toFixed(2)} {currency}</span>
                          </div>
                          {tx.note ? <p className="b365-wallet-history-note">{tx.note}</p> : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {historyQ.data && historyQ.data.totalPages > 1 ? (
                <div className="b365-wallet-history-pagination">
                  <button
                    type="button"
                    className="b365-btn-secondary"
                    disabled={!historyQ.data.hasPrev}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <span className="b365-muted">
                    Page {historyQ.data.page} of {historyQ.data.totalPages}
                  </span>
                  <button
                    type="button"
                    className="b365-btn-secondary"
                    disabled={!historyQ.data.hasNext}
                    onClick={() => setHistoryPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
