import { create } from 'zustand';
import { BETSLIP_TYPE_SINGLE, type BetslipEventLike, type BetslipLike } from '../../api/placeBet';
import { placeBetDoBetp } from '../../api/placeBet';

export type SelectionKey = string;

function keyFor(gameId: number | string, marketId: number, eventId: number): SelectionKey {
  return `${gameId}-${marketId}-${eventId}`;
}

type BetslipState = {
  type: number;
  stake: number;
  events: Record<string, BetslipEventLike>;
  placeStatus: 'idle' | 'loading' | 'success' | 'error';
  placeMessage: string | null;
  addSelection: (key: SelectionKey, ev: BetslipEventLike) => void;
  removeSelection: (key: SelectionKey) => void;
  /** Remove every slip line for this game+market (1/X/2 radio behaviour). Keys are `gameId-marketId-eventId`. */
  removeSelectionsForGameMarket: (gameId: number, marketId: number) => void;
  clear: () => void;
  setStake: (n: number) => void;
  toSlipPayload: () => BetslipLike;
  placeBet: (possibleWin: number, bones: number) => Promise<void>;
};

export const useBetslipStore = create<BetslipState>((set, get) => ({
  type: BETSLIP_TYPE_SINGLE,
  stake: 1,
  events: {},
  placeStatus: 'idle',
  placeMessage: null,

  addSelection: (key, ev) => {
    set((s) => ({
      events: { ...s.events, [key]: ev },
      placeMessage: null,
    }));
  },

  removeSelection: (key) => {
    set((s) => {
      const next = { ...s.events };
      delete next[key];
      return { events: next };
    });
  },

  removeSelectionsForGameMarket: (gameId, marketId) => {
    const prefix = `${gameId}-${marketId}-`;
    set((s) => {
      const next = { ...s.events };
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) delete next[key];
      }
      return { events: next, placeMessage: null };
    });
  },

  clear: () => set({ events: {}, placeStatus: 'idle', placeMessage: null }),

  setStake: (n) => set({ stake: Math.max(0, n) }),

  toSlipPayload: (): BetslipLike => {
    const s = get();
    return {
      type: s.type,
      events: { ...s.events },
      stake: s.stake,
    };
  },

  placeBet: async (possibleWin, bones) => {
    const slip = get().toSlipPayload();
    if (Object.keys(slip.events).length === 0) {
      set({ placeStatus: 'error', placeMessage: 'Add at least one selection.' });
      return;
    }
    set({ placeStatus: 'loading', placeMessage: null });
    try {
      await placeBetDoBetp(slip, slip, possibleWin, bones);
      set({ placeStatus: 'success', placeMessage: 'Bet accepted.', events: {} });
    } catch (e) {
      const code = e && typeof e === 'object' && 'code' in e ? Number((e as { code?: number }).code) : undefined;
      const msg =
        e instanceof Error
          ? e.message
          : 'Could not place bet.';
      set({
        placeStatus: 'error',
        placeMessage: code === 12 ? 'Please sign in (username + phone) in the header.' : msg,
      });
    }
  },
}));

export { keyFor };
