import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { restGetLiveGames } from '../api/restSports';
import { useSports } from '../contexts/SportsContext';
import MatchListByDate from '../components/MatchListByDate';
import PopularLeagueChips from '../components/PopularLeagueChips';
import { POPULAR_LEAGUE_KEYS, type PopularLeagueKey } from '../constants/popularLeagues';
import { competitionMatchesLeague } from '../utils/competitionFilter';
import { isSoccerFootballSport } from '../utils/isSoccerFootballSport';

const LIVE_INPLAY_LEAGUE_OPTIONS = ['All', ...POPULAR_LEAGUE_KEYS] as const;

function isPopularLeagueKey(v: string | null | undefined): v is PopularLeagueKey {
  return v != null && (POPULAR_LEAGUE_KEYS as readonly string[]).includes(v);
}

export default function LiveGamesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sports } = useSports();
  const sportParam = searchParams.get('sport');
  const sportId = sportParam != null && sportParam !== '' ? Number.parseInt(sportParam, 10) : NaN;
  const filterBySport = Number.isFinite(sportId) && sportId > 0;
  const leagueParam = searchParams.get('league');

  const q = useQuery({
    queryKey: ['live-games'],
    queryFn: () => restGetLiveGames(),
    refetchInterval: 20_000,
  });

  const filteredGames = useMemo(() => {
    const list = q.data;
    if (!list?.length) return list;
    if (!filterBySport) return list;
    return list.filter((g) => g.sportId === sportId);
  }, [q.data, filterBySport, sportId]);

  const selectedSportMeta = useMemo(() => {
    if (!filterBySport) return null;
    return sports.find((s) => s.id === sportId) ?? null;
  }, [sports, filterBySport, sportId]);

  const isSoccerLive =
    !!selectedSportMeta && isSoccerFootballSport(selectedSportMeta.alias, selectedSportMeta.name);

  const selectedPopularLeague: PopularLeagueKey | null = isPopularLeagueKey(leagueParam) ? leagueParam : null;

  const displayGames = useMemo(() => {
    const list = filteredGames;
    if (!list?.length) return list;
    if (!isSoccerLive || !selectedPopularLeague) return list;
    return list.filter((g) => competitionMatchesLeague(g.competitionName, selectedPopularLeague));
  }, [filteredGames, isSoccerLive, selectedPopularLeague]);

  const sportLabel = useMemo(() => {
    if (!filterBySport) return null;
    return selectedSportMeta?.name ?? null;
  }, [filterBySport, selectedSportMeta]);

  const setLiveLeague = (name: string) => {
    const next = new URLSearchParams(searchParams);
    if (name === 'All') {
      next.delete('league');
    } else {
      next.set('league', name);
    }
    const qs = next.toString();
    navigate({ pathname: '/live', search: qs ? `?${qs}` : '' }, { replace: true });
  };

  const leagueHeader = useMemo(() => {
    if (sportLabel && selectedPopularLeague && isSoccerLive) {
      return `${sportLabel} · ${selectedPopularLeague}`;
    }
    if (sportLabel) return `${sportLabel} · live`;
    return 'Live now';
  }, [sportLabel, selectedPopularLeague, isSoccerLive]);

  const emptyMessage = useMemo(() => {
    if (selectedPopularLeague && isSoccerLive && sportLabel) {
      return `No live ${sportLabel} in ${selectedPopularLeague} right now.`;
    }
    if (sportLabel) {
      return `No live ${sportLabel} games right now.`;
    }
    return 'No live games right now.';
  }, [sportLabel, selectedPopularLeague, isSoccerLive]);

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>In-Play</span>
      </div>

      <h1 className="b365-page-title">In-Play</h1>

      {isSoccerLive ? (
        <div className="b365-live-league-strip">
          <PopularLeagueChips
            leagues={LIVE_INPLAY_LEAGUE_OPTIONS}
            value={selectedPopularLeague ?? 'All'}
            onChange={setLiveLeague}
            ariaLabel="Popular leagues (in play)"
          />
        </div>
      ) : null}

      <div className="b365-league-header">{leagueHeader}</div>
      <MatchListByDate
        games={displayGames}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage={emptyMessage}
        liveMode
      />
    </div>
  );
}
