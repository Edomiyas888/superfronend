import { Link, useSearchParams } from 'react-router-dom';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import { isDateFilterKey, type DateFilterKey } from '../constants/dateFilters';
import { useWorldCupMatches } from '../hooks/useWorldCupMatches';

const DEFAULT_DATE_FILTER: DateFilterKey = 'all';

export default function WorldCup2026Page() {
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

  const q = useWorldCupMatches(dateFilter);

  return (
    <div className="b365-wc-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>World Cup 2026</span>
      </div>

      <header className="b365-wc-hero">
        <div className="b365-wc-hero__glow" aria-hidden />
        <div className="b365-wc-hero__content">
          <p className="b365-wc-hero__eyebrow">FIFA · USA · Mexico · Canada</p>
          <h1 className="b365-wc-hero__title">World Cup 2026</h1>
          <p className="b365-wc-hero__sub">
            All tournament fixtures — filter by date and bet on every match.
          </p>
        </div>
      </header>

      <section className="b365-match-filters-panel b365-wc-filters" aria-label="World Cup date filters">
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
          <DateFilterChips value={dateFilter} onChange={setDateFilter} ariaLabel="World Cup kickoff date range" />
        </div>
      </section>

      <div className="b365-league-header">Tournament fixtures</div>
      <MatchListByDate
        games={q.data}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage="No World Cup 2026 fixtures in this date range. Try All or a wider window."
      />
    </div>
  );
}
