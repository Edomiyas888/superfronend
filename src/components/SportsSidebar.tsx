import { Link, useLocation } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { sportPageSearchParams } from '../constants/sportQuickLeagues';
import { SportIcon } from './SportIcon';

export default function SportsSidebar() {
  const { sports, loading, error } = useSports();
  const loc = useLocation();

  return (
    <div className="b365-sidebar-inner">
      <div className="b365-sidebar-heading">Sports</div>
      {loading && <p className="b365-muted">Loading…</p>}
      {error && <p className="b365-error">{error.message}</p>}

      <nav className="b365-sports-list" aria-label="Sports">
        {sports.map((s) => {
          const to = `/sport/${s.id}?${sportPageSearchParams(s.alias)}`;
          const active = loc.pathname === `/sport/${s.id}`;
          return (
            <Link key={s.id} to={to} className={`b365-sport-tile ${active ? 'active' : ''}`} title={s.name}>
              <span className="b365-sport-tile-icon">
                <SportIcon alias={s.alias} name={s.name} />
              </span>
              <span className="b365-sport-tile-label">{s.name}</span>
              {s.gameCount != null && <span className="b365-sport-tile-count">{s.gameCount}</span>}
            </Link>
          );
        })}
      </nav>

      {!loading && sports.length === 0 && <p className="b365-muted">No sports for this filter.</p>}
    </div>
  );
}
