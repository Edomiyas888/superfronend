import { Link, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchSportsWithCounts } from '../api/swarmClient';
import { restGetLiveGames } from '../api/restSports';
import LiveMatchFilters from '../components/LiveMatchFilters';
import MatchListByDate from '../components/MatchListByDate';
import { resolveInPlaySportAlias } from '../constants/inPlayDefaults';
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

export default function LiveGamesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sportParam = searchParams.get('sport');
  const sportAlias = resolveInPlaySportAlias(sportParam);
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

  const sportsQ = useQuery({
    queryKey: ['sports', 'counts', 'live'],
    queryFn: () => fetchSportsWithCounts('live'),
    staleTime: 25_000,
  });

  const q = useQuery({
    queryKey: ['live-games', sportAlias ?? 'all'],
    queryFn: () => restGetLiveGames({ sportAlias }),
    refetchInterval: 20_000,
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

  const activeFilterCount =
    countActiveFilters({ region, competition, search, quickLeague }) +
    (sportParam === 'all' ? 1 : 0);
  const totalCount = q.data?.length ?? 0;
  const quickLabel = sportQuickLeagueFromSlug(quickLeague).label;
  const sportLabel =
    sportAlias === undefined
      ? 'All sports'
      : sportsQ.data?.find((s) => s.alias === sportAlias)?.name ?? sportAlias;

  return (
    <div className="b365-sport-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>In-Play</span>
      </div>

      <h1 className="b365-page-title">In-Play</h1>

      <LiveMatchFilters
        sports={sportsQ.data ?? []}
        sportsLoading={sportsQ.isLoading}
        sportAlias={sportAlias}
        onSportAliasChange={(alias) =>
          patchParams({ sport: alias == null ? 'all' : alias })
        }
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
          patchParams({ sport: null, league: null, region: null, competition: null, q: null })
        }
        activeFilterCount={activeFilterCount}
        resultCount={filteredGames.length}
        totalCount={totalCount}
      />

      <div className="b365-league-header">
        {quickLeague ? `${quickLabel} · ` : ''}
        {sportLabel} · Live now
      </div>
      <MatchListByDate
        games={filteredGames}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage={
          activeFilterCount > 0
            ? 'No live matches match your filters.'
            : 'No live games right now.'
        }
        liveMode
      />
    </div>
  );
}
