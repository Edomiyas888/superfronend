/** Home: hero promos + featured match + popular / upcoming lists. */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePopularMatches } from '../hooks/usePopularMatches';
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
import { curatePopularGames } from '../utils/popularGames';

export default function SportsHomePage() {
  const { loading, error } = useSports();
  const [popularLeague, setPopularLeague] = useState<string>(POPULAR_LEAGUE_KEYS[0]);
  const [featuredDate, setFeaturedDate] = useState<DateFilterKey>('week');

  const popularQ = usePopularMatches();
  const upcomingQ = useUpcomingMatches('Soccer', featuredDate);

  const popularGames = useMemo(() => {
    const raw = popularQ.data ?? [];
    const leagueFiltered = raw.filter((g) => competitionMatchesLeague(g.competitionName, popularLeague));
    return curatePopularGames(leagueFiltered, 16);
  }, [popularQ.data, popularLeague]);

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
          {popularLeague} · next 3 days
        </div>
        <MatchListByDate
          games={popularGames}
          isPending={popularQ.isPending}
          isError={popularQ.isError}
          error={popularQ.error}
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
