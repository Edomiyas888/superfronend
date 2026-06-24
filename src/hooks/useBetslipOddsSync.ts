import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { restGetMatchOdds } from '../api/restSports';
import { useBetslipStore } from '../features/betslip/betslipStore';
import { liveDisplayFromMatchDetail } from '../utils/matchLiveDisplay';

const POLL_MS = 10_000;

/**
 * Poll Swarm for current prices on betslip selections and flag corrections.
 */
export function useBetslipOddsSync() {
  const events = useBetslipStore((s) => s.events);
  const updateSelectionPrice = useBetslipStore((s) => s.updateSelectionPrice);
  const setLiveDisplay = useBetslipStore((s) => s.setLiveDisplay);
  const ids = Object.keys(events);
  const queryClient = useQueryClient();

  useEffect(() => {
    const onWallet = () => {
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
    };
    window.addEventListener('superbet:wallet-changed', onWallet);
    return () => window.removeEventListener('superbet:wallet-changed', onWallet);
  }, [queryClient]);

  useEffect(() => {
    if (ids.length === 0) return;

    const gameIds = [...new Set(ids.map((id) => Number(events[id]?.gameId)).filter(Number.isFinite))];

    const sync = async () => {
      for (const gameId of gameIds) {
        let detail;
        try {
          detail = await restGetMatchOdds(gameId);
        } catch {
          continue;
        }
        if (!detail) continue;

        const liveDisplay = liveDisplayFromMatchDetail(detail);
        setLiveDisplay(gameId, liveDisplay.isLive ? liveDisplay : null);

        for (const id of ids) {
          const ev = events[id];
          if (!ev || Number(ev.gameId) !== gameId) continue;

          const market = detail.markets.find((m) => Number(m.id) === Number(ev.marketId));
          if (!market) {
            updateSelectionPrice(id, ev.price, true);
            continue;
          }

          const event = market.events.find((e) => Number(e.id) === Number(ev.eventId));
          if (!event || !Number.isFinite(event.price) || event.price <= 1) {
            updateSelectionPrice(id, ev.price, true);
            continue;
          }

          if (Math.abs(event.price - ev.price) > 0.001) {
            updateSelectionPrice(id, event.price, false);
          }
        }
      }
    };

    void sync();
    const t = setInterval(() => void sync(), POLL_MS);
    return () => clearInterval(t);
  }, [ids.join('|'), events, updateSelectionPrice, setLiveDisplay]);
}
