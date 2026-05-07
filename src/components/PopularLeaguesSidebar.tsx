import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import { usePopularLeagueFilterStore } from '../features/home/popularLeagueFilterStore';

function LeagueGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8.5v7M8.5 12h7" />
    </svg>
  );
}

export default function PopularLeaguesSidebar() {
  const value = usePopularLeagueFilterStore((s) => s.selectedLeague);
  const onChange = usePopularLeagueFilterStore((s) => s.setSelectedLeague);

  return (
    <aside className="b365-trending-sidebar" aria-label="League filters">
      <div className="b365-trending-group">
        <h2 className="b365-trending-title">Leagues</h2>
        <div className="b365-trending-list" role="tablist" aria-label="Filter by league">
          {POPULAR_LEAGUE_KEYS.map((name) => {
            const active = value === name;
            return (
              <button
                key={name}
                type="button"
                className={`b365-trending-item ${active ? 'active' : ''}`}
                onClick={() => onChange(name)}
                title={name}
                aria-pressed={active || undefined}
              >
                <span className="b365-trending-item-icon">
                  <LeagueGlyph />
                </span>
                <span className="b365-trending-item-label">{name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
