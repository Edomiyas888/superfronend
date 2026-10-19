import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import 'flag-icons/css/flag-icons.min.css';
import { restGetMatchesForSport } from '../api/restSports';
import MatchListByDate from '../components/MatchListByDate';
import {
  DEFAULT_SPORT_TIME_FILTER,
  isSportTimeFilterKey,
  SPORT_TIME_FILTERS,
  type SportTimeFilterKey,
} from '../constants/sportTimeFilters';
import {
  quickLeagueToParam,
  resolveQuickLeagueSlug,
  sportQuickLeagueFromSlug,
  type SportQuickLeagueSlug,
} from '../constants/sportQuickLeagues';
import RegionList from '../features/sportPage/RegionList';
import { groupGamesByRegion } from '../features/sportPage/regionGroups';
import { filterGames } from '../utils/matchListFilters';
import { isSpecialOrVirtualFixture } from '../utils/specialFixtureFilter';

/**
 * A sport's fixtures: kickoff-window chips over a country list (flag · name · count) that opens
 * into competitions and their matches. A league picked by link (`?league=champions-league`, or
 * MMA's UFC default) shows that league's matches directly instead.
 */
export default function SportMatchesPage() {
  const { sportId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = sportId ? parseInt(sportId, 10) : NaN;
  const alias = searchParams.get('alias')?.trim() || undefined;
  const periodParam = searchParams.get('period');
  const timeFilter: SportTimeFilterKey = isSportTimeFilterKey(periodParam) ? periodParam : DEFAULT_SPORT_TIME_FILTER;
  const quickLeague: SportQuickLeagueSlug = resolveQuickLeagueSlug(searchParams.get('league'), alias);
  const quickLeagueFilter = sportQuickLeagueFromSlug(quickLeague, alias);
  const search = searchParams.get('q')?.trim() ?? '';

  const patchParams = (patch: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (value == null || value === '') next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true }
    );
  };

  const q = useQuery({
    queryKey: ['matches', id, alias ?? '', timeFilter],
    queryFn: () => restGetMatchesForSport(id, { sportAlias: alias, timeHours: timeFilter }),
    enabled: Number.isFinite(id),
    refetchInterval: 30_000,
    retry: 2,
  });

  const filteredGames = useMemo(
    () =>
      // Swarm stats pseudo-fixtures ("1st Teams (Goals)") and virtual feeds are not real matches.
      filterGames(q.data, {
        region: '',
        competition: '',
        search,
        quickLeague: quickLeagueFilter.leagueKey ?? '',
      }).filter((g) => !isSpecialOrVirtualFixture(g)),
    [q.data, search, quickLeagueFilter.leagueKey]
  );

  // A picked league or a search reads best as one dated list; otherwise browse by country.
  const flatList = Boolean(quickLeague) || Boolean(search);
  const regions = useMemo(() => (flatList ? [] : groupGamesByRegion(filteredGames)), [flatList, filteredGames]);

  const title = alias ? decodeURIComponent(alias) : 'Sport';
  const emptyMessage = 'No fixtures in this time range. Try All.';

  return (
    <div className="b365-sport-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>{title}</span>
      </div>

      <div className="b365-time-chips" role="tablist" aria-label="Kickoff time">
        {SPORT_TIME_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={timeFilter === f.key}
            className={`b365-time-chip${timeFilter === f.key ? ' b365-time-chip--active' : ''}`}
            onClick={() => patchParams({ period: f.key === DEFAULT_SPORT_TIME_FILTER ? null : f.key })}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="b365-md-search b365-sport-search">
        <svg className="b365-md-search__icon" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          className="b365-input b365-md-search__input"
          placeholder="Search teams or leagues…"
          value={search}
          onChange={(e) => patchParams({ q: e.target.value || null })}
          aria-label="Search fixtures"
        />
        {search ? (
          <button
            type="button"
            className="b365-md-search__clear"
            onClick={() => patchParams({ q: null })}
            aria-label="Clear search"
          >
            ×
          </button>
        ) : null}
      </div>

      {quickLeague ? (
        <div className="b365-sport-league">
          <span className="b365-sport-league__name">{quickLeagueFilter.label}</span>
          <button
            type="button"
            className="b365-sport-league__clear"
            onClick={() => patchParams({ league: quickLeagueToParam('') })}
            aria-label={`Show all ${title} leagues`}
          >
            All leagues ×
          </button>
        </div>
      ) : null}

      {flatList || q.isLoading || q.isError ? (
        <MatchListByDate
          games={filteredGames}
          isPending={q.isLoading}
          isError={q.isError}
          error={q.error}
          emptyMessage={search ? `No fixtures match “${search}”.` : emptyMessage}
        />
      ) : regions.length === 0 ? (
        <p className="b365-muted b365-md-empty">{emptyMessage}</p>
      ) : (
        <RegionList key={id} regions={regions} />
      )}
    </div>
  );
}
