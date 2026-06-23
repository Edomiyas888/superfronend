import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import BetSlipAccordion from '../components/BetSlipAccordion';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchMyBets } from '../features/bets/betsApi';

export default function MyBetsPage() {
  const { username, getAuthHeader } = useSessionStore();
  const loggedIn = !!username;

  const q = useQuery({
    queryKey: ['my-bets'],
    queryFn: () => fetchMyBets(getAuthHeader(), { limit: 50 }),
    enabled: loggedIn,
  });

  return (
    <div className="b365-my-bets-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>My bets</span>
      </div>

      <h1 className="b365-page-title">My bets</h1>

      {!loggedIn ? (
        <div className="card b365-card">
          <p className="b365-muted" style={{ margin: 0 }}>
            Sign in to view your placed bets.
          </p>
        </div>
      ) : q.isLoading ? (
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
            No placed bets yet. Add selections from a match and place a bet from the bet slip.
          </p>
        </div>
      ) : (
        <div className="b365-my-bets-list">
          {q.data!.items.map((bet, i) => (
            <BetSlipAccordion key={bet.id} bet={bet} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}
