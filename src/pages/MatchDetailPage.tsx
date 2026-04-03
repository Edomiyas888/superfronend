import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { restGetMatchOdds } from '../api/restSports';
import { useBetslipStore, keyFor } from '../features/betslip/betslipStore';
import TeamLogo from '../components/TeamLogo';
import type { BetslipEventLike } from '../api/placeBet';

export default function MatchDetailPage() {
  const { gameId } = useParams();
  const id = gameId ? parseInt(gameId, 10) : NaN;
  const addSelection = useBetslipStore((s) => s.addSelection);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const events = useBetslipStore((s) => s.events);

  const q = useQuery({
    queryKey: ['match-odds', id],
    queryFn: () => restGetMatchOdds(id),
    enabled: Number.isFinite(id),
    refetchInterval: 15_000,
  });

  const detail = q.data;

  const toggleOdd = (marketId: number, eventId: number, name: string, price: number, marketName: string) => {
    if (!detail) return;
    const k = keyFor(detail.gameId, marketId, eventId);
    const existing = events[k];
    if (existing) {
      removeSelection(k);
      return;
    }
    const ev: BetslipEventLike = {
      eventId,
      gameId: detail.gameId,
      marketName,
      marketType: marketName,
      teamone: detail.team1,
      teamtwo: detail.team2,
      region: detail.regionName,
      competitionName: detail.competitionName,
      title: `${detail.team1} vs ${detail.team2}`,
      pick: name,
      price,
      isLive: detail.isLive,
      dateofmatch: Math.floor(detail.startTs),
    };
    addSelection(k, ev);
  };

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Match</span>
      </div>

      {q.isLoading && <p className="b365-muted">Loading markets…</p>}
      {q.isError && <p className="b365-error">{q.error instanceof Error ? q.error.message : 'Error'}</p>}

      {detail && (
        <>
          <div className="b365-event-hero">
            <div className="b365-event-hero-teams">
              <div className="b365-event-hero-side">
                <TeamLogo
                  teamId={detail.team1Id}
                  name={detail.team1}
                  className="b365-event-hero-logo"
                  fallbackClassName="b365-event-hero-logo-fallback"
                />
                <span className="b365-event-hero-name">{detail.team1}</span>
              </div>
              <span className="b365-event-hero-vs">v</span>
              <div className="b365-event-hero-side">
                <TeamLogo
                  teamId={detail.team2Id}
                  name={detail.team2}
                  className="b365-event-hero-logo"
                  fallbackClassName="b365-event-hero-logo-fallback"
                />
                <span className="b365-event-hero-name">{detail.team2}</span>
              </div>
            </div>
            <p className="b365-event-meta">
              {detail.competitionName} · {detail.sportName} · {detail.isLive ? 'In-Play' : 'Pre-Match'} ·{' '}
              {new Date(detail.startTs * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>

          {detail.markets.map((m) => (
            <div key={m.id} className="b365-market-block">
              <div className="b365-market-title">{m.name}</div>
              <div className="b365-odds-row">
                {m.events.map((e) => {
                  const k = keyFor(detail.gameId, m.id, e.id);
                  const sel = !!events[k];
                  return (
                    <button
                      key={e.id}
                      type="button"
                      className={`odds-btn ${sel ? 'selected' : ''}`}
                      onClick={() => toggleOdd(m.id, e.id, e.name, e.price, m.name)}
                    >
                      <div className="odds-name">{e.name}</div>
                      <div className="odds-price">{e.price}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {!q.isLoading && !detail && <p className="b365-muted">Match not found.</p>}
    </div>
  );
}
