import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BetSlipAccordion from './BetSlipAccordion';
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

type Props = {
  authHeaders: Record<string, string>;
  loggedIn: boolean;
};

export default function BetslipMyBetsPanel({ authHeaders, loggedIn }: Props) {
  const [filter, setFilter] = useState<MyBetsFilter>('open');
  const queryClient = useQueryClient();

  const q = useMyBetsQuery({
    scope: 'betslip',
    filter,
    authHeaders,
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
    <div className="b365-betslip-my-bets">
      <div className="b365-betslip-subtabs" role="tablist" aria-label="Bet history filter">
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

      {!loggedIn ? (
        <p className="b365-betslip-empty">
          <Link to="/profile">Sign in</Link> to view your bets.
        </p>
      ) : q.isLoading ? (
        <p className="b365-betslip-empty">Loading bets…</p>
      ) : q.isError ? (
        <p className="b365-error">{(q.error as Error).message}</p>
      ) : (q.data?.items.length ?? 0) === 0 ? (
        <p className="b365-betslip-empty">No {filter} bets.</p>
      ) : (
        <div className="b365-betslip-my-bets-list">
          {q.data!.items.map((bet) => (
            <BetSlipAccordion key={bet.id} bet={bet} />
          ))}
        </div>
      )}
    </div>
  );
}
