import { Link, useLocation } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { SportIcon } from './SportIcon';
import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import { usePopularLeagueFilterStore } from '../features/home/popularLeagueFilterStore';

function isHomeSportsPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/sport-new';
}

export default function SportsSidebar() {
  const { sports, loading, error } = useSports();
  const loc = useLocation();
  const isHome = isHomeSportsPath(loc.pathname);
  const selectedLeague = usePopularLeagueFilterStore((s) => s.selectedLeague);
  const setSelectedLeague = usePopularLeagueFilterStore((s) => s.setSelectedLeague);

  return (
    <div className={`b365-sidebar-inner ${isHome ? 'b365-sidebar-inner--home-split' : ''}`}>
      <div className="b365-sidebar-section b365-sidebar-section--sports">
        <div className="b365-sidebar-heading">Sports</div>
        {loading && <p className="b365-muted b365-sidebar-hint">Loading…</p>}
        {error && <p className="b365-error b365-sidebar-hint">{error.message}</p>}

        <nav className="b365-sports-list" aria-label="Sports">
          {sports.map((s) => {
            const to = `/sport/${s.id}?alias=${encodeURIComponent(s.alias)}`;
            const active = loc.pathname === `/sport/${s.id}`;
            return (
              <Link key={s.id} to={to} className={`b365-sport-tile ${active ? 'active' : ''}`} title={s.name}>
                <span className="b365-sport-tile-icon">
                  <SportIcon alias={s.alias} name={s.name} className="b365-sport-tile-svg" />
                </span>
                <span className="b365-sport-tile-label">{s.name}</span>
                {s.gameCount != null && <span className="b365-sport-tile-count">{s.gameCount}</span>}
              </Link>
            );
          })}
        </nav>

        {!loading && sports.length === 0 && <p className="b365-muted b365-sidebar-hint">No sports for this filter.</p>}
      </div>

      {isHome && (
        <>
          <div className="b365-sidebar-divider b365-sidebar-divider--home" aria-hidden />
          <div className="b365-sidebar-section b365-sidebar-section--leagues">
            <div className="b365-sidebar-heading">Leagues</div>
            <p className="b365-sidebar-subhint">Filter home fixtures</p>
            <div className="b365-sidebar-league-list" role="tablist" aria-label="Popular leagues">
              {POPULAR_LEAGUE_KEYS.map((name) => {
                const active = selectedLeague === name;
                return (
                  <button
                    key={name}
                    type="button"
                    className={`b365-sidebar-league-btn ${active ? 'active' : ''}`}
                    onClick={() => setSelectedLeague(name)}
                    title={name}
                    aria-pressed={active || undefined}
                  >
                    <span className="b365-sidebar-league-dot" aria-hidden />
                    <span className="b365-sidebar-league-label">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
