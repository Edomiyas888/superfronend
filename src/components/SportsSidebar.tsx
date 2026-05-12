import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { SportIcon } from './SportIcon';
import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import { usePopularLeagueFilterStore } from '../features/home/popularLeagueFilterStore';
import AccordionItem from './AccordionItem';

function isHomeSportsPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/sport-new';
}

const ACC_LEAGUES = 'top-leagues';
const ACC_SPORTS = 'all-sports';

function useMediaMinWidth(minWidth: number): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(`(min-width: ${minWidth}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [minWidth]);

  return matches;
}

export default function SportsSidebar() {
  const { sports, loading, error } = useSports();
  const loc = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHome = isHomeSportsPath(loc.pathname);
  const isLivePage = loc.pathname === '/live';
  const selectedLeague = usePopularLeagueFilterStore((s) => s.selectedLeague);
  const setSelectedLeague = usePopularLeagueFilterStore((s) => s.setSelectedLeague);
  const isWide = useMediaMinWidth(1000);

  const [openSection, setOpenSection] = useState<typeof ACC_LEAGUES | typeof ACC_SPORTS>(ACC_SPORTS);

  useEffect(() => {
    if (!isWide) return;
    if (!isHome) {
      setOpenSection(ACC_SPORTS);
      return;
    }
    setOpenSection(ACC_LEAGUES);
  }, [isHome, isWide]);

  const liveSportId = searchParams.get('sport');

  const setLiveSportFilter = (id: number) => {
    const next = new URLSearchParams(searchParams);
    if (liveSportId === String(id)) {
      next.delete('sport');
    } else {
      next.set('sport', String(id));
    }
    next.delete('league');
    next.delete('comp');
    const qs = next.toString();
    navigate({ pathname: '/live', search: qs ? `?${qs}` : '' }, { replace: true });
  };

  const sportsBody = (
    <>
      {loading && <p className="b365-muted b365-sidebar-hint">Loading…</p>}
      {error && <p className="b365-error b365-sidebar-hint">{error.message}</p>}

      <nav className="b365-sports-list" aria-label="Sports">
        {sports.map((s) => {
          const to = `/sport/${s.id}?alias=${encodeURIComponent(s.alias)}`;
          const activeOnSportPage = loc.pathname === `/sport/${s.id}`;
          const activeOnLive = isLivePage && liveSportId === String(s.id);
          const active = isLivePage ? activeOnLive : activeOnSportPage;

          if (isLivePage) {
            return (
              <button
                key={s.id}
                type="button"
                className={`b365-sport-tile ${active ? 'active' : ''}`}
                title={s.name}
                aria-pressed={active}
                onClick={() => setLiveSportFilter(s.id)}
              >
                <span className="b365-sport-tile-icon">
                  <SportIcon alias={s.alias} name={s.name} className="b365-sport-tile-svg" />
                </span>
                <span className="b365-sport-tile-label">{s.name}</span>
                {s.gameCount != null && <span className="b365-sport-tile-count">{s.gameCount}</span>}
              </button>
            );
          }

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
    </>
  );

  const leaguesBody = (
    <>
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
    </>
  );

  const onOpenLeagues = () => setOpenSection(ACC_LEAGUES);
  const onOpenSports = () => setOpenSection(ACC_SPORTS);

  if (!isWide) {
    return (
      <div className={`b365-sidebar-inner ${isHome ? 'b365-sidebar-inner--home-split' : ''}`}>
        <div className="b365-sidebar-section b365-sidebar-section--sports">
          <div className="b365-sidebar-heading">Sports</div>
          {sportsBody}
        </div>

        {isHome && (
          <>
            <div className="b365-sidebar-divider b365-sidebar-divider--home" aria-hidden />
            <div className="b365-sidebar-section b365-sidebar-section--leagues">
              <div className="b365-sidebar-heading">Leagues</div>
              {leaguesBody}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`b365-sidebar-inner ${isHome ? 'b365-sidebar-inner--home-split' : ''}`}>
      {!isHome ? (
        <div className="b365-sidebar-section b365-sidebar-section--sports">
          <AccordionItem title="All Sports" collapsible={false}>
            {sportsBody}
          </AccordionItem>
        </div>
      ) : (
        <>
          <div className="b365-sidebar-section b365-sidebar-section--sports">
            <AccordionItem title="All Sports" isOpen={openSection === ACC_SPORTS} onToggle={onOpenSports}>
              {sportsBody}
            </AccordionItem>
          </div>

          <div className="b365-sidebar-divider b365-sidebar-divider--home" aria-hidden />

          <div className="b365-sidebar-section b365-sidebar-section--leagues">
            <AccordionItem title="Top Leagues" isOpen={openSection === ACC_LEAGUES} onToggle={onOpenLeagues}>
              {leaguesBody}
            </AccordionItem>
          </div>
        </>
      )}
    </div>
  );
}
