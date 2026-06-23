/** Home: popular (league filter) + featured upcoming (sports rail in layout sidebar). */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSports } from '../contexts/SportsContext';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePopularMatches } from '../hooks/usePopularMatches';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import MatchOfTheDay from '../components/MatchOfTheDay';
import PromoBannerCarousel from '../components/PromoBannerCarousel';
import PopularLeagueChips from '../components/PopularLeagueChips';
import { POPULAR_LEAGUE_KEYS } from '../constants/popularLeagues';
import type { DateFilterKey } from '../constants/dateFilters';
import { competitionMatchesLeague } from '../utils/competitionFilter';

export default function SportsHomePage() {
  const { loading, error } = useSports();
  const [popularLeague, setPopularLeague] = useState<string>(POPULAR_LEAGUE_KEYS[0]);
  const [featuredDate, setFeaturedDate] = useState<DateFilterKey>('week');

  const popularQ = usePopularMatches();
  const upcomingQ = useUpcomingMatches('Soccer', featuredDate);

  const popularGames = useMemo(() => {
    const raw = popularQ.data ?? [];
    return raw.filter((g) => competitionMatchesLeague(g.competitionName, popularLeague));
  }, [popularQ.data, popularLeague]);

  return (
    <div>
      <PromoBannerCarousel />

      <MatchOfTheDay />

      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Sports</span>
      </div>

      <section className="b365-home-block">
        <h2 className="b365-page-title">Popular</h2>
        <PopularLeagueChips leagues={POPULAR_LEAGUE_KEYS} value={popularLeague} onChange={setPopularLeague} />
        <div className="b365-league-header">
          {popularLeague} · next 48h
        </div>
        <MatchListByDate
          games={popularGames}
          isPending={popularQ.isPending}
          isError={popularQ.isError}
          error={popularQ.error}
          emptyMessage="No fixtures for this league in the next 48 hours."
          maxGames={16}
        />
      </section>

      <section className="b365-home-block b365-home-block--spaced">
        <h2 className="b365-page-title">Featured</h2>

        {loading && <p className="b365-muted">Loading sports…</p>}
        {error && <p className="b365-error">{error.message}</p>}

        <DateFilterChips value={featuredDate} onChange={setFeaturedDate} ariaLabel="Kickoff date range" />
        <div className="b365-league-header">Upcoming — Soccer</div>
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
