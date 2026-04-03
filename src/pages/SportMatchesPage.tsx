import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restGetMatchesForSport } from '../api/restSports';
import MatchListByDate from '../components/MatchListByDate';

export default function SportMatchesPage() {
  const { sportId } = useParams();
  const [searchParams] = useSearchParams();
  const id = sportId ? parseInt(sportId, 10) : NaN;
  const alias = searchParams.get('alias')?.trim() || undefined;

  const q = useQuery({
    queryKey: ['matches', id, alias ?? ''],
    queryFn: () => restGetMatchesForSport(id, { sportAlias: alias }),
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

      <div className="b365-league-header">Match list</div>
      <MatchListByDate
        games={q.data}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage="No fixtures for this sport."
      />
    </div>
  );
}
