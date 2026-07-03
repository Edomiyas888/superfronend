import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NormalizedSport } from '../api/types';
import { DEFAULT_INPLAY_SPORT_ALIAS } from '../constants/inPlayDefaults';
import { getSportQuickLeagueFilters, isMmaSportAlias, type SportQuickLeagueSlug } from '../constants/sportQuickLeagues';
import { SportIcon } from './SportIcon';

type Props = {
  sports: NormalizedSport[];
  sportsLoading?: boolean;
  sportAlias: string | undefined;
  onSportAliasChange: (alias: string | undefined) => void;
  quickLeague: SportQuickLeagueSlug;
  onQuickLeagueChange: (slug: SportQuickLeagueSlug) => void;
  regions: string[];
  region: string;
  onRegionChange: (region: string) => void;
  competitions: string[];
  competition: string;
  onCompetitionChange: (competition: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  onClearFilters: () => void;
  activeFilterCount: number;
  resultCount: number;
  totalCount: number;
};

export default function LiveMatchFilters({
  sports,
  sportsLoading,
  sportAlias,
  onSportAliasChange,
  quickLeague,
  onQuickLeagueChange,
  regions,
  region,
  onRegionChange,
  competitions,
  competition,
  onCompetitionChange,
  search,
  onSearchChange,
  onClearFilters,
  activeFilterCount,
  resultCount,
  totalCount,
}: Props) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const advancedActive = Boolean(region || competition || search);
  const quickLeagueFilters = getSportQuickLeagueFilters(sportAlias);
  const showWorldCupLink = !isMmaSportAlias(sportAlias);
  const allSports = sportAlias === undefined;

  const sportChips = sports.filter((s) => (s.gameCount ?? 0) > 0 || s.alias === DEFAULT_INPLAY_SPORT_ALIAS);

  return (
    <section className="b365-match-filters-panel" aria-label="In-play filters">
      <div className="b365-match-filters-panel__head">
        <span className="b365-match-filters-panel__count">
          {resultCount === totalCount
            ? `${totalCount} live match${totalCount === 1 ? '' : 'es'}`
            : `${resultCount} of ${totalCount}`}
        </span>
        {activeFilterCount > 0 ? (
          <button type="button" className="b365-match-filters-panel__clear" onClick={onClearFilters}>
            Clear ({activeFilterCount})
          </button>
        ) : null}
      </div>

      <div className="b365-match-filters__group">
        <span className="b365-match-filters__label">Sport</span>
        <div className="b365-pop-leagues b365-pop-leagues--compact" role="tablist" aria-label="Sport filter">
          <div className="b365-pop-leagues-scroll">
            <button
              type="button"
              role="tab"
              aria-selected={allSports}
              className={`b365-pop-league-chip ${allSports ? 'active' : ''}`}
              onClick={() => onSportAliasChange(undefined)}
            >
              All sports
            </button>
            {sportsLoading && sportChips.length === 0 ? (
              <span className="b365-muted b365-match-filters__loading">Loading…</span>
            ) : (
              sportChips.map((s) => {
                const active = !allSports && sportAlias === s.alias;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`b365-pop-league-chip b365-live-sport-chip ${active ? 'active' : ''}`}
                    onClick={() => onSportAliasChange(s.alias)}
                    title={s.name}
                  >
                    <span className="b365-live-sport-chip__icon" aria-hidden>
                      <SportIcon alias={s.alias} name={s.name} />
                    </span>
                    {s.name}
                    {s.gameCount != null ? (
                      <span className="b365-live-sport-chip__count">{s.gameCount}</span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="b365-match-filters__group">
        <span className="b365-match-filters__label">Competition</span>
        <div className="b365-pop-leagues b365-pop-leagues--compact" role="tablist" aria-label="Quick league filter">
          <div className="b365-pop-leagues-scroll">
            {quickLeagueFilters.map(({ slug, label, featured }) => {
              const active = quickLeague === slug;
              const isWc = slug === 'world-cup';
              return (
                <button
                  key={slug || 'all'}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`b365-pop-league-chip ${active ? 'active' : ''} ${featured ? 'b365-pop-league-chip--featured' : ''} ${isWc ? 'b365-pop-league-chip--wc' : ''}`}
                  onClick={() => onQuickLeagueChange(slug)}
                >
                  {isWc ? (
                    <span className="b365-pop-league-chip__wc-icon" aria-hidden>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M8 21h8M12 17v4M7 4h10l1 4H6l1-4z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  ) : null}
                  {label}
                </button>
              );
            })}
          </div>
        </div>
        {showWorldCupLink && quickLeague === 'world-cup' ? (
          <Link to="/world-cup-2026" className="b365-match-filters-wc-link">
            Open full World Cup 2026 hub →
          </Link>
        ) : null}
      </div>

      <div className="b365-match-filters-advanced">
        <button
          type="button"
          className={`b365-match-filters-advanced__toggle ${advancedOpen ? 'open' : ''}`}
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((v) => !v)}
        >
          <span>More filters</span>
          {advancedActive && !advancedOpen ? (
            <span className="b365-match-filters-advanced__badge" aria-label="Advanced filters active" />
          ) : null}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {advancedOpen ? (
          <div className="b365-match-filters-advanced__body">
            <div className="b365-match-filters-advanced__grid">
              {regions.length > 0 ? (
                <label className="b365-match-filters-field">
                  <span className="b365-match-filters__label">Region</span>
                  <select
                    className="b365-input b365-match-filters__select"
                    value={region}
                    onChange={(e) => onRegionChange(e.target.value)}
                    aria-label="Filter by region"
                  >
                    <option value="">All regions</option>
                    {regions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {competitions.length > 0 ? (
                <label className="b365-match-filters-field">
                  <span className="b365-match-filters__label">League</span>
                  <select
                    className="b365-input b365-match-filters__select"
                    value={competition}
                    onChange={(e) => onCompetitionChange(e.target.value)}
                    aria-label="Filter by league"
                  >
                    <option value="">All leagues ({competitions.length})</option>
                    {competitions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>

            <label className="b365-match-filters-field">
              <span className="b365-match-filters__label">Search</span>
              <input
                type="search"
                className="b365-input b365-match-filters__search"
                placeholder="Team or league name…"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search live matches"
              />
            </label>
          </div>
        ) : null}
      </div>
    </section>
  );
}
