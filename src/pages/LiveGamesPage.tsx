import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restGetLiveGames } from '../api/restSports';
import MatchListByDate from '../components/MatchListByDate';

export default function LiveGamesPage() {
  const q = useQuery({
    queryKey: ['live-games'],
    queryFn: () => restGetLiveGames(),
    refetchInterval: 20_000,
  });

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>In-Play</span>
      </div>

      <h1 className="b365-page-title">In-Play</h1>

      <div className="b365-league-header">Live now</div>
      <MatchListByDate
        games={q.data}
        isPending={q.isLoading}
        isError={q.isError}
        error={q.error}
        emptyMessage="No live games right now."
        liveMode
      />
    </div>
  );
}
