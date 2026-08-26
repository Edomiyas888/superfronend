/** Home: hero promos + featured match + popular / upcoming lists. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePopularMatches } from '../hooks/usePopularMatches';
import { usePremierLeagueMatches } from '../hooks/usePremierLeagueMatches';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import MatchOfTheDay from '../components/MatchOfTheDay';
import PromoBannerCarousel from '../components/PromoBannerCarousel';
import HomeQuickActions from '../components/HomeQuickActions';
import GuessAndWinSection from '../features/guessWin/GuessAndWinSection';
import PopularLeagueChips from '../components/PopularLeagueChips';
import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import type { DateFilterKey } from '../constants/dateFilters';
import { competitionMatchesLeague } from '../utils/competitionFilter';
import { curatePopularGames, POPULAR_DAY_WINDOW } from '../utils/popularGames';

export default function SportsHomePage() {
  const { loading, error } = useSports();
  const [popularLeague, setPopularLeague] = useState<string>(POPULAR_LEAGUE_KEYS[0]);
  const [featuredDate, setFeaturedDate] = useState<DateFilterKey>('week');

  const popularQ = usePopularMatches();
  // The Premier League chip is the default, so it gets its own precise (England-scoped) feed.
  const premierLeagueQ = usePremierLeagueMatches('week');
  const upcomingQ = useUpcomingMatches('Soccer', featuredDate);

  const isPremierLeague = popularLeague === 'Premier League';
  const popularSource = isPremierLeague ? premierLeagueQ : popularQ;

  const popularGames = useMemo(() => {
    if (popularLeague === 'Premier League') {
      return curatePopularGames(premierLeagueQ.data ?? [], 16, 7);
    }
    const raw = popularQ.data ?? [];
    const leagueFiltered = raw.filter((g) =>
      competitionMatchesLeague(g.competitionName, popularLeague, g.regionName)
    );
    return curatePopularGames(leagueFiltered, 16);
  }, [popularQ.data, premierLeagueQ.data, popularLeague]);

  const popularDayWindow = isPremierLeague ? 7 : POPULAR_DAY_WINDOW;

  return (
    <div className="b365-home">
      <div className="b365-home-hero">
        <PromoBannerCarousel />
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
        <PopularLeagueChips leagues={POPULAR_LEAGUE_KEYS} value={popularLeague} onChange={setPopularLeague} />
        <div className="b365-league-header">
          {popularLeague} · next {popularDayWindow} days
        </div>
        <MatchListByDate
          games={popularGames}
          isPending={popularSource.isPending}
          isError={popularSource.isError}
          error={popularSource.error}
          emptyMessage="No upcoming fixtures for this league."
          maxGames={16}
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
