import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchWalletTransactions, type WalletTransaction } from './walletApi';
import { formatMoney, txIsCredit, txTypeLabel, type WalletHistoryFilter } from './transactionLabels';
import { HistoryIcon, TxIcon } from './WalletIcons';

const FILTERS: { id: WalletHistoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'deposit', label: 'Deposits' },
  { id: 'withdraw', label: 'Withdrawals' },
  { id: 'bets', label: 'Bets' },
  { id: 'bet_win', label: 'Wins' },
];

type Props = {
  authHeaders: Record<string, string>;
  currency: string;
  enabled: boolean;
  onDeposit: () => void;
};

function dayKey(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toDateString();
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
  });
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function groupByDay(items: WalletTransaction[]) {
  const groups: { key: string; label: string; items: WalletTransaction[] }[] = [];
  for (const tx of items) {
    const key = dayKey(tx.createdAt);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.items.push(tx);
    else groups.push({ key, label: dayLabel(tx.createdAt), items: [tx] });
  }
  return groups;
}

export default function TransactionHistory({ authHeaders, currency, enabled, onDeposit }: Props) {
  const [filter, setFilter] = useState<WalletHistoryFilter>('all');
  const [page, setPage] = useState(1);

  const historyQ = useQuery({
    queryKey: ['wallet', 'transactions', page, filter],
    queryFn: () =>
      fetchWalletTransactions(authHeaders, {
        page,
        limit: 20,
        type: filter === 'all' ? undefined : filter,
      }),
    enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const items = historyQ.data?.items ?? [];

  return (
    <div className="b365-wallet-history">
      <div className="b365-wallet-chips" role="group" aria-label="Filter transactions">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            className={filter === f.id ? 'active' : ''}
            onClick={() => {
              setFilter(f.id);
              setPage(1);
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {historyQ.isLoading ? (
        <ul className="b365-wallet-tx-list" aria-label="Loading transactions">
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className="b365-wallet-tx b365-wallet-tx--skeleton">
              <span className="b365-wallet-skeleton b365-wallet-skeleton--icon" />
              <span className="b365-wallet-skeleton b365-wallet-skeleton--line" />
            </li>
          ))}
        </ul>
      ) : historyQ.isError ? (
        <div className="b365-wallet-empty">
          <p className="b365-wallet-empty__title">Couldn&apos;t load transactions</p>
          <p>{(historyQ.error as Error).message}</p>
          <button type="button" className="b365-wallet-btn b365-wallet-btn--ghost" onClick={() => void historyQ.refetch()}>
            Try again
          </button>
        </div>
      ) : items.length === 0 ? (
        <div className="b365-wallet-empty">
          <span className="b365-wallet-empty__icon">
            <HistoryIcon size={22} />
          </span>
          <p className="b365-wallet-empty__title">
            {filter === 'all' ? 'No transactions yet' : 'Nothing here yet'}
          </p>
          <p>Deposits, bets, wins and withdrawals will show up here.</p>
          {filter === 'all' ? (
            <button type="button" className="b365-wallet-btn b365-wallet-btn--primary" onClick={onDeposit}>
              Make a deposit
            </button>
          ) : null}
        </div>
      ) : (
        <div className={historyQ.isFetching ? 'b365-wallet-history__list is-fetching' : 'b365-wallet-history__list'}>
          {groupByDay(items).map((group) => (
            <section key={group.key} className="b365-wallet-tx-group">
              <h3 className="b365-wallet-tx-group__day">{group.label}</h3>
              <ul className="b365-wallet-tx-list">
                {group.items.map((tx) => {
                  const credit = txIsCredit(tx.type);
                  return (
                    <li key={tx.id} className="b365-wallet-tx">
                      <span className={`b365-wallet-tx__icon b365-wallet-tx__icon--${credit ? 'in' : 'out'}`}>
                        <TxIcon type={tx.type} />
                      </span>
                      <div className="b365-wallet-tx__body">
                        <span className="b365-wallet-tx__title">{txTypeLabel(tx.type)}</span>
                        <span className="b365-wallet-tx__meta">
                          {timeLabel(tx.createdAt)}
                          {tx.note ? ` · ${tx.note}` : ''}
                        </span>
                      </div>
                      <div className="b365-wallet-tx__amounts">
                        <span className={`b365-wallet-tx__amount b365-wallet-tx__amount--${credit ? 'in' : 'out'}`}>
                          {credit ? '+' : '−'}
                          {formatMoney(Number(tx.amount))}
                        </span>
                        <span className="b365-wallet-tx__after">
                          {formatMoney(Number(tx.balanceAfter))} {currency}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {historyQ.data && historyQ.data.totalPages > 1 ? (
        <div className="b365-wallet-pager">
          <button
            type="button"
            className="b365-wallet-btn b365-wallet-btn--ghost"
            disabled={!historyQ.data.hasPrev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Newer
          </button>
          <span>
            {historyQ.data.page} / {historyQ.data.totalPages}
          </span>
          <button
            type="button"
            className="b365-wallet-btn b365-wallet-btn--ghost"
            disabled={!historyQ.data.hasNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Older
          </button>
        </div>
      ) : null}
    </div>
  );
}
