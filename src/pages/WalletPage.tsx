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

type WalletTab = 'deposit' | 'withdraw' | 'history';

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

function formatType(type: string): string {
  return type.replace(/_/g, ' ');
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
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletErr, setWalletErr] = useState<string | null>(null);
  const [historyType, setHistoryType] = useState<'all' | 'deposit' | 'withdraw'>('all');
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
    enabled: loggedIn && tab === 'history',
    placeholderData: (prev) => prev,
  });

  const setTab = (next: WalletTab) => {
    setSearchParams(next === 'deposit' ? {} : { tab: next });
    setWalletErr(null);
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
    const amt = parseWalletAmount();
    if (amt == null) {
      setWalletErr('Enter a positive amount.');
      return;
    }
    setWalletBusy(true);
    try {
      await withdrawWallet(getAuthHeader(), amt);
      setWalletAmount('');
      await invalidateWallet();
    } catch (err) {
      setWalletErr(err instanceof Error ? err.message : 'Withdraw failed.');
    } finally {
      setWalletBusy(false);
    }
  };

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Wallet</span>
      </div>

      <h1 className="b365-page-title">Wallet</h1>

      {!loggedIn ? (
        <div className="card b365-card">
          <p className="b365-muted" style={{ margin: 0 }}>
            Sign in to deposit, withdraw, and view your transaction history.{' '}
            <Link to="/profile">Log in</Link>
          </p>
        </div>
      ) : (
        <>
          <div className="card b365-card b365-profile-card b365-wallet-balance-card">
            <h2 className="b365-profile-heading">Balance</h2>
            <p className="b365-profile-balance">
              {walletQ.isPending
                ? '…'
                : walletQ.isError || walletQ.data?.status === 'error'
                  ? '—'
                  : Number(walletQ.data?.balance ?? 0).toFixed(2)}{' '}
              <span className="b365-muted">{walletQ.data?.currency ?? 'ETB'}</span>
            </p>
          </div>

          <div className="b365-profile-tabs b365-wallet-tabs">
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
              Transaction history
            </button>
          </div>

          {tab === 'deposit' ? (
            <div className="card b365-card b365-profile-card">
              <h2 className="b365-profile-heading">Deposit via Telebirr</h2>
              <TelebirrDepositFlow
                authHeaders={getAuthHeader()}
                currency={walletQ.data?.currency ?? 'ETB'}
                onSuccess={() => {
                  void invalidateWallet();
                }}
              />
            </div>
          ) : null}

          {tab === 'withdraw' ? (
            <div className="card b365-card b365-profile-card">
              <h2 className="b365-profile-heading">Withdraw</h2>
              <p className="b365-muted b365-profile-note">
                Withdraw funds from your wallet balance.
              </p>
              <label className="b365-field-label">
                Amount
                <input
                  type="number"
                  className="b365-input"
                  min={0}
                  step={0.01}
                  value={walletAmount}
                  onChange={(e) => setWalletAmount(e.target.value)}
                  disabled={walletBusy}
                />
              </label>
              <div className="b365-wallet-actions">
                <button
                  type="button"
                  className="b365-btn-secondary"
                  disabled={walletBusy}
                  onClick={() => void onWithdraw()}
                >
                  {walletBusy ? 'Withdrawing…' : 'Withdraw'}
                </button>
              </div>
              {walletErr && <p className="b365-error">{walletErr}</p>}
            </div>
          ) : null}

          {tab === 'history' ? (
            <div className="card b365-card b365-profile-card">
              <div className="b365-wallet-history-filters">
                <label className="b365-field-label">
                  Type
                  <select
                    className="b365-input"
                    value={historyType}
                    onChange={(e) => {
                      setHistoryType(e.target.value as 'all' | 'deposit' | 'withdraw');
                      setHistoryPage(1);
                    }}
                  >
                    <option value="all">All</option>
                    <option value="deposit">Deposit</option>
                    <option value="withdraw">Withdraw</option>
                  </select>
                </label>
              </div>

              {historyQ.isLoading ? (
                <p className="b365-muted">Loading transactions…</p>
              ) : historyQ.isError ? (
                <p className="b365-error">{(historyQ.error as Error).message}</p>
              ) : (historyQ.data?.items.length ?? 0) === 0 ? (
                <p className="b365-muted">No transactions yet.</p>
              ) : (
                <ul className="b365-wallet-history-list">
                  {historyQ.data!.items.map((tx) => (
                    <li key={tx.id} className="b365-wallet-history-item">
                      <div className="b365-wallet-history-main">
                        <span
                          className={
                            tx.type === 'deposit' || tx.type === 'bet_win' || tx.type === 'bet_void'
                              ? 'b365-wallet-tx-deposit'
                              : 'b365-wallet-tx-withdraw'
                          }
                        >
                          {formatType(tx.type)}
                        </span>
                        <strong>
                          {tx.type === 'deposit' || tx.type === 'bet_win' || tx.type === 'bet_void'
                            ? '+'
                            : '−'}
                          {Number(tx.amount).toFixed(2)} {walletQ.data?.currency ?? 'ETB'}
                        </strong>
                      </div>
                      <div className="b365-wallet-history-meta">
                        <span>{formatDate(tx.createdAt)}</span>
                        <span>Balance after: {Number(tx.balanceAfter).toFixed(2)}</span>
                      </div>
                      {tx.note ? <p className="b365-wallet-history-note">{tx.note}</p> : null}
                    </li>
                  ))}
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
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
