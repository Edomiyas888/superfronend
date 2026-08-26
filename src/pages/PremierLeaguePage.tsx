import { Link, useSearchParams } from 'react-router-dom';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import { isDateFilterKey, type DateFilterKey } from '../constants/dateFilters';
import { usePremierLeagueMatches } from '../hooks/usePremierLeagueMatches';

const DEFAULT_DATE_FILTER: DateFilterKey = 'all';

export default function PremierLeaguePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const periodParam = searchParams.get('period');
  const dateFilter: DateFilterKey = isDateFilterKey(periodParam) ? periodParam : DEFAULT_DATE_FILTER;

  const setDateFilter = (key: DateFilterKey) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('period', key);
        return next;
      },
      { replace: true }
    );
  };

  const q = usePremierLeagueMatches(dateFilter);

  return (
    <div className="b365-epl-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Premier League</span>
      </div>

      <header className="b365-epl-hero">
        <div className="b365-epl-hero__glow" aria-hidden />
        <div className="b365-epl-hero__content">
          <p className="b365-epl-hero__eyebrow">England · Top flight</p>
          <h1 className="b365-epl-hero__title">English Premier League</h1>
          <p className="b365-epl-hero__sub">
            Every matchweek fixture — filter by date and bet on every match.
          </p>
        </div>
      </header>

      <section
        className="b365-match-filters-panel b365-epl-filters"
        aria-label="Premier League date filters"
      >
        <div className="b365-match-filters-panel__head">
          <span className="b365-match-filters-panel__count">
            {q.isPending
              ? 'Loading…'
              : q.isError
                ? 'Error'
                : `${q.data?.length ?? 0} match${(q.data?.length ?? 0) === 1 ? '' : 'es'}`}
          </span>
        </div>
        <div className="b365-match-filters__group">
          <span className="b365-match-filters__label">Kickoff date</span>
          <DateFilterChips
            value={dateFilter}
            onChange={setDateFilter}
            ariaLabel="Premier League kickoff date range"
          />
        </div>
      </section>

      <div className="b365-league-header">Premier League fixtures</div>
      <MatchListByDate
        games={q.data}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage="No Premier League fixtures in this date range. Try All or a wider window."
      />
    </div>
  );
}
