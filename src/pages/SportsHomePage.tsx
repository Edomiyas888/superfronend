/** Home: hero promos + featured match + popular / upcoming lists. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GameView } from '../api/types';
import { useSports } from '../contexts/SportsContext';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePopularMatches } from '../hooks/usePopularMatches';
import { usePremierLeagueMatches } from '../hooks/usePremierLeagueMatches';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import MatchOfTheDay from '../components/MatchOfTheDay';
import PromoBannerCarousel from '../components/PromoBannerCarousel';
import HappyHourCard from '../features/promo/HappyHourCard';
import SpinPromoCard from '../features/spin/SpinPromoCard';
import InvitePromoCard from '../features/referral/InvitePromoCard';
import HomeQuickActions from '../components/HomeQuickActions';
import GuessAndWinSection from '../features/guessWin/GuessAndWinSection';
import PopularLeagueChips from '../components/PopularLeagueChips';
import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import type { DateFilterKey } from '../constants/dateFilters';
import { competitionMatchesLeague } from '../utils/competitionFilter';
import { curatePopularGames, POPULAR_DAY_WINDOW } from '../utils/popularGames';

/** Popular chip selected on arrival, while it has fixtures in its window. */
const DEFAULT_POPULAR_LEAGUE = 'UEFA Champions League';
/** Selected instead when the default league is between matchdays. */
const FALLBACK_POPULAR_LEAGUE = 'Premier League';

function leagueGames(games: GameView[] | undefined, league: string): GameView[] {
  return curatePopularGames(
    (games ?? []).filter((g) => competitionMatchesLeague(g.competitionName, league, g.regionName))
  );
}

export default function SportsHomePage() {
  const { loading, error } = useSports();
  // null until the user picks a chip — then the default below applies.
  const [pickedLeague, setPickedLeague] = useState<string | null>(null);
  const [featuredDate, setFeaturedDate] = useState<DateFilterKey>('week');

  const popularQ = usePopularMatches();
  // The Premier League chip gets its own precise (England-scoped) feed.
  const premierLeagueQ = usePremierLeagueMatches('week');
  const upcomingQ = useUpcomingMatches('Soccer', featuredDate);

  // The Champions League plays every two or three weeks; between matchdays its 3-day window is
  // empty, so open on the Premier League rather than an empty list. While loading, assume it plays.
  const defaultLeague =
    popularQ.isSuccess && leagueGames(popularQ.data, DEFAULT_POPULAR_LEAGUE).length === 0
      ? FALLBACK_POPULAR_LEAGUE
      : DEFAULT_POPULAR_LEAGUE;
  const popularLeague = pickedLeague ?? defaultLeague;

  const isPremierLeague = popularLeague === 'Premier League';
  const popularSource = isPremierLeague ? premierLeagueQ : popularQ;

  const popularGames = useMemo(() => {
    if (popularLeague === 'Premier League') {
      return curatePopularGames(premierLeagueQ.data ?? [], 7);
    }
    return leagueGames(popularQ.data, popularLeague);
  }, [popularQ.data, premierLeagueQ.data, popularLeague]);

  const popularDayWindow = isPremierLeague ? 7 : POPULAR_DAY_WINDOW;

  return (
    <div className="b365-home">
      <div className="b365-home-hero">
        <PromoBannerCarousel />
        <HappyHourCard />
        <SpinPromoCard />
        <InvitePromoCard />
        <HomeQuickActions />
      </div>

      <section className="b365-home-section" aria-label="Featured match">
        <div className="b365-home-section__head">
          <h2 className="b365-home-section__title">Featured match</h2>
        </div>
        <MatchOfTheDay />
      </section>

      <GuessAndWinSection />

      <section className="b365-home-block">
        <div className="b365-home-section__head">
          <h2 className="b365-home-section__title">Popular</h2>
          <Link to="/sports" className="b365-home-section__link">
            See all
          </Link>
        </div>
        <PopularLeagueChips leagues={POPULAR_LEAGUE_KEYS} value={popularLeague} onChange={setPickedLeague} />
        <div className="b365-league-header">
          {popularLeague} · next {popularDayWindow} days
        </div>
        <MatchListByDate
          games={popularGames}
          isPending={popularSource.isPending}
          isError={popularSource.isError}
          error={popularSource.error}
          emptyMessage="No upcoming fixtures for this league."
        />
      </section>

      <section className="b365-home-block b365-home-block--spaced">
        <div className="b365-home-section__head">
          <h2 className="b365-home-section__title">Upcoming</h2>
          <Link to="/sports" className="b365-home-section__link">
            All sports
          </Link>
        </div>

        {loading && <p className="b365-muted">Loading sports…</p>}
        {error && <p className="b365-error">{error.message}</p>}

        <DateFilterChips value={featuredDate} onChange={setFeaturedDate} ariaLabel="Kickoff date range" />
        <div className="b365-league-header">Soccer fixtures</div>
        <MatchListByDate
          games={upcomingQ.data}
          isPending={upcomingQ.isPending}
          isError={upcomingQ.isError}
          error={upcomingQ.error}
          emptyMessage="No upcoming Soccer fixtures in this date range."
          maxGames={16}
        />
      </section>
    </div>
  );
}
