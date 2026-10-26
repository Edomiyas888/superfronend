import { useQuery } from '@tanstack/react-query';
import { getApiBaseUrl } from '../../api/config';
import { PrizeIcon } from './SpinSprite';
import { findSegment } from './spinRules';

type Winner = { id: string; player: string; prizeId: string; at: string };

async function fetchWinners(): Promise<Winner[]> {
  const res = await fetch(`${getApiBaseUrl()}/v1/promo/spins/winners`);
  if (!res.ok) return [];
  const data = (await res.json()) as { items?: Winner[] };
  return Array.isArray(data.items) ? data.items : [];
}

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/** Real recent wins from every player (masked by the server), refreshed while the page is open. */
export default function SpinLiveWins() {
  const { data: winners = [], dataUpdatedAt } = useQuery({
    queryKey: ['promo', 'spin-winners'],
    queryFn: fetchWinners,
    refetchInterval: 15_000,
  });

  return (
    <section className="b365-spin-live" aria-labelledby="spin-live-title">
      <h2 id="spin-live-title">
        <span className="b365-spin-card__dot" aria-hidden /> Live wins
      </h2>
      {winners.length === 0 ? (
        <p className="b365-spin-live__empty">No winners yet tonight — your spin could be the first.</p>
      ) : (
        <ul>
          {winners.map((w) => {
            const prize = findSegment(w.prizeId);
            if (!prize) return null;
            return (
              <li key={w.id} className={`is-${prize.tone}`}>
                <PrizeIcon icon={prize.icon} size={26} />
                <span className="b365-spin-live__who">{w.player}</span>
                <span className="b365-spin-live__what">won {prize.label}</span>
                <time dateTime={w.at}>{ago(w.at, dataUpdatedAt || Date.now())}</time>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
