import { Link } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { SportIcon } from '../components/SportIcon';

/** Full-width list of all sports (same data as sidebar rail). */
export default function AllSportsPage() {
  const { sports, loading, error } = useSports();

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>All sports</span>
      </div>

      <h1 className="b365-page-title">All sports</h1>

      {loading && <p className="b365-muted">Loading…</p>}
      {error && <p className="b365-error">{error.message}</p>}

      {!loading && sports.length > 0 && (
        <div className="b365-all-sports-grid">
          {sports.map((s) => (
            <Link
              key={s.id}
              to={`/sport/${s.id}?alias=${encodeURIComponent(s.alias)}`}
              className="b365-all-sports-card"
            >
              <span className="b365-all-sports-card-icon" aria-hidden>
                <SportIcon alias={s.alias} name={s.name} />
              </span>
              <span className="b365-all-sports-card-name">{s.name}</span>
              {s.gameCount != null && <span className="b365-all-sports-card-count">{s.gameCount} games</span>}
            </Link>
          ))}
        </div>
      )}

      {!loading && sports.length === 0 && <p className="b365-muted">No sports for this filter.</p>}
    </div>
  );
}
