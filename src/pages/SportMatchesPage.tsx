import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restGetMatchesForSport } from '../api/restSports';
import DateFilterChips from '../components/DateFilterChips';
import MatchListByDate from '../components/MatchListByDate';
import { isDateFilterKey, type DateFilterKey } from '../constants/dateFilters';

const DEFAULT_DATE_FILTER: DateFilterKey = 'week';

export default function SportMatchesPage() {
  const { sportId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const id = sportId ? parseInt(sportId, 10) : NaN;
  const alias = searchParams.get('alias')?.trim() || undefined;
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

  const q = useQuery({
    queryKey: ['matches', id, alias ?? '', dateFilter],
    queryFn: () => restGetMatchesForSport(id, { sportAlias: alias, timeHours: dateFilter }),
    enabled: Number.isFinite(id),
    refetchInterval: 30_000,
    retry: 2,
  });

  const title = alias ? decodeURIComponent(alias) : 'Sport';

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>{title}</span>
      </div>

      <h1 className="b365-page-title">{title}</h1>

      <DateFilterChips value={dateFilter} onChange={setDateFilter} ariaLabel="Kickoff date range" />
      <div className="b365-league-header">Match list</div>
      <MatchListByDate
        games={q.data}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage="No fixtures for this sport in the selected date range."
      />
    </div>
  );
}
