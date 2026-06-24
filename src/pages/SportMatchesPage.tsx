import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { restGetMatchesForSport } from '../api/restSports';
import MatchListByDate from '../components/MatchListByDate';
import MatchListFilters from '../components/MatchListFilters';
import { isDateFilterKey, type DateFilterKey } from '../constants/dateFilters';
import {
  isSportQuickLeagueSlug,
  sportQuickLeagueFromSlug,
  type SportQuickLeagueSlug,
} from '../constants/sportQuickLeagues';
import {
  countActiveFilters,
  extractCompetitions,
  extractRegions,
  filterGames,
} from '../utils/matchListFilters';

const DEFAULT_DATE_FILTER: DateFilterKey = 'week';

export default function SportMatchesPage() {
  const { sportId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = sportId ? parseInt(sportId, 10) : NaN;
  const alias = searchParams.get('alias')?.trim() || undefined;
  const periodParam = searchParams.get('period');
  const dateFilter: DateFilterKey = isDateFilterKey(periodParam) ? periodParam : DEFAULT_DATE_FILTER;
  const leagueParam = searchParams.get('league')?.trim() ?? '';
  const quickLeague: SportQuickLeagueSlug = isSportQuickLeagueSlug(leagueParam)
    ? (leagueParam as SportQuickLeagueSlug)
    : '';
  const quickLeagueKey = sportQuickLeagueFromSlug(quickLeague).leagueKey ?? '';
  const region = searchParams.get('region')?.trim() ?? '';
  const competition = searchParams.get('competition')?.trim() ?? '';
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

  const setDateFilter = (key: DateFilterKey) => patchParams({ period: key });

  const q = useQuery({
    queryKey: ['matches', id, alias ?? '', dateFilter],
    queryFn: () => restGetMatchesForSport(id, { sportAlias: alias, timeHours: dateFilter }),
    enabled: Number.isFinite(id),
    refetchInterval: 30_000,
    retry: 2,
  });

  const regions = useMemo(() => extractRegions(q.data), [q.data]);
  const competitions = useMemo(
    () => extractCompetitions(q.data, region),
    [q.data, region]
  );

  const filteredGames = useMemo(
    () =>
      filterGames(q.data, {
        region,
        competition,
        search,
        quickLeague: quickLeagueKey === 'world-cup' ? 'world-cup' : quickLeagueKey,
      }),
    [q.data, region, competition, search, quickLeagueKey]
  );

  const activeFilterCount = countActiveFilters({
    region,
    competition,
    search,
    quickLeague: quickLeague,
  });
  const totalCount = q.data?.length ?? 0;

  const title = alias ? decodeURIComponent(alias) : 'Sport';
  const quickLabel = sportQuickLeagueFromSlug(quickLeague).label;

  return (
    <div className="b365-sport-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>{title}</span>
      </div>

      <h1 className="b365-page-title">{title}</h1>

      <MatchListFilters
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        quickLeague={quickLeague}
        onQuickLeagueChange={(slug) =>
          patchParams({ league: slug || null, region: null, competition: null })
        }
        regions={regions}
        region={region}
        onRegionChange={(next) => patchParams({ region: next || null, competition: null })}
        competitions={competitions}
        competition={competition}
        onCompetitionChange={(next) => patchParams({ competition: next || null })}
        search={search}
        onSearchChange={(next) => patchParams({ q: next || null })}
        onClearFilters={() =>
          patchParams({ league: null, region: null, competition: null, q: null })
        }
        activeFilterCount={activeFilterCount}
        resultCount={filteredGames.length}
        totalCount={totalCount}
      />

      <div className="b365-league-header">
        {quickLeague ? `${quickLabel} · ` : ''}Match list
      </div>
      <MatchListByDate
        games={filteredGames}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage={
          activeFilterCount > 0
            ? 'No fixtures match your filters. Try All or change the date range.'
            : 'No fixtures for this sport in the selected date range.'
        }
      />
    </div>
  );
}
