import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import BetSlipAccordion from '../components/BetSlipAccordion';
import { useSessionStore } from '../features/auth/sessionStore';
import {
  invalidateMyBetsQueries,
  type MyBetsFilter,
  useMyBetsQuery,
} from '../features/bets/useMyBetsQuery';

const FILTERS: { id: MyBetsFilter; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'lost', label: 'Lost' },
  { id: 'won', label: 'Won' },
];

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export default function MyBetsPage() {
  const { username, getAuthHeader } = useSessionStore();
  const loggedIn = !!username;
  const [filter, setFilter] = useState<MyBetsFilter>('open');
  const queryClient = useQueryClient();

  const q = useMyBetsQuery({
    scope: 'page',
    filter,
    authHeaders: getAuthHeader(),
    enabled: loggedIn,
  });

  useEffect(() => {
    const refresh = () => {
      invalidateMyBetsQueries(queryClient);
    };
    window.addEventListener('superbet:my-bets-changed', refresh);
    return () => window.removeEventListener('superbet:my-bets-changed', refresh);
  }, [queryClient]);

  return (
    <div className="b365-my-bets-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>My bets</span>
      </div>

      <div className="b365-my-bets-head">
        <h1 className="b365-page-title">My bets</h1>
        {loggedIn ? (
          <button
            type="button"
            className={`b365-my-bets-refresh${q.isFetching ? ' b365-my-bets-refresh--busy' : ''}`}
            onClick={() => invalidateMyBetsQueries(queryClient)}
            disabled={q.isFetching}
            aria-label="Refresh bet history"
          >
            <RefreshIcon />
            <span>Refresh</span>
          </button>
        ) : null}
      </div>

      {!loggedIn ? (
        <div className="card b365-card">
          <p className="b365-muted" style={{ margin: 0 }}>
            Sign in to view your placed bets.
          </p>
        </div>
      ) : (
        <>
          <div className="b365-betslip-subtabs b365-my-bets-subtabs" role="tablist" aria-label="Bet history filter">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={filter === item.id}
                className={`b365-betslip-subtab${filter === item.id ? ' active' : ''}`}
                onClick={() => {
                  setFilter(item.id);
                  invalidateMyBetsQueries(queryClient);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {q.isLoading ? (
            <div className="b365-my-bets-loading">
              <div className="b365-my-bets-loading__dots" aria-hidden>
                <span className="b365-my-bets-loading__dot" />
                <span className="b365-my-bets-loading__dot" />
                <span className="b365-my-bets-loading__dot" />
              </div>
              <p className="b365-muted">Loading your bet slips…</p>
            </div>
          ) : q.isError ? (
            <p className="b365-error">{(q.error as Error).message}</p>
          ) : (q.data?.items.length ?? 0) === 0 ? (
            <div className="card b365-card b365-my-bets-empty">
              <p className="b365-muted" style={{ margin: 0 }}>
                No {filter} bets yet.
                {filter === 'open'
                  ? ' Add selections from a match and place a bet from the bet slip.'
                  : ''}
              </p>
            </div>
          ) : (
            <div className="b365-my-bets-list">
              {q.data!.items.map((bet, i) => (
                <BetSlipAccordion key={bet.id} bet={bet} defaultOpen={filter === 'open' && i === 0} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
