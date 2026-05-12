/** Home: popular (league filter) + optional “starting soon” list (tab below Match of the Day). */
import { useMemo, useState } from 'react';
import { useUpcomingMatches } from '../hooks/useUpcomingMatches';
import { usePopularMatches } from '../hooks/usePopularMatches';
import { usePopularLeagueFilterStore } from '../features/home/popularLeagueFilterStore';
import MatchListByDate from '../components/MatchListByDate';
import MatchOfTheDay from '../components/MatchOfTheDay';
import HomePromoBannerCarousel from '../components/HomePromoBannerCarousel';
import PopularLeaguesSidebar from '../components/PopularLeaguesSidebar';
import SoonFilterChips from '../components/SoonFilterChips';
import { competitionMatchesLeague } from '../utils/competitionFilter';
import { SOON_HEADER_LABEL, type SoonFilterKey } from '../constants/upcomingSoon';

type FixturesTab = 'home' | 'upcoming';

export default function SportsHomePage() {
  const popularLeague = usePopularLeagueFilterStore((s) => s.selectedLeague);
  const [fixturesTab, setFixturesTab] = useState<FixturesTab>('home');
  const [soonWindow, setSoonWindow] = useState<SoonFilterKey>('6');

  const popularQ = usePopularMatches();
  const upcomingSoonQ = useUpcomingMatches('Soccer', soonWindow, fixturesTab === 'upcoming');

  const popularGames = useMemo(() => {
    const raw = popularQ.data ?? [];
    return raw.filter((g) => competitionMatchesLeague(g.competitionName, popularLeague));
  }, [popularQ.data, popularLeague]);

  return (
    <div className="b365-home-layout">
      <div className="b365-home-main">
        <HomePromoBannerCarousel />
        <MatchOfTheDay />

        <div className="b365-home-popular-sidebar">
          <PopularLeaguesSidebar />
        </div>

        <div className="b365-home-fixtures-bar">
          <div className="b365-home-fixtures-tabs" role="tablist" aria-label="Fixtures">
            <button
              type="button"
              role="tab"
              aria-selected={fixturesTab === 'home'}
              className={`b365-home-fixtures-tab ${fixturesTab === 'home' ? 'active' : ''}`}
              onClick={() => setFixturesTab('home')}
            >
              Home
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={fixturesTab === 'upcoming'}
              className={`b365-home-fixtures-tab ${fixturesTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setFixturesTab('upcoming')}
            >
              Upcoming matches
            </button>
          </div>
        </div>

        {fixturesTab === 'home' ? (
          <section className="b365-home-block">
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
        ) : (
          <section className="b365-home-block">
            <SoonFilterChips value={soonWindow} onChange={setSoonWindow} ariaLabel="Kickoff time window" />
            <div className="b365-league-header">Soccer · {SOON_HEADER_LABEL[soonWindow]}</div>
            <MatchListByDate
              games={upcomingSoonQ.data}
              isPending={upcomingSoonQ.isPending}
              isError={upcomingSoonQ.isError}
              error={upcomingSoonQ.error}
              emptyMessage="No Soccer fixtures starting in this window."
              maxGames={24}
            />
          </section>
        )}
      </div>
    </div>
  );
}
