import { create } from 'zustand';
import {
  BETSLIP_TYPE_SINGLE,
  type BetslipEventLike,
  type BetslipLike,
  type OddsCorrectionChange,
} from '../../api/placeBet';
import { placeBetSlip } from '../bets/betsApi';
import { useSessionStore } from '../auth/sessionStore';
import { isBetslipDrawerViewport, useBetslipDrawerStore } from './betslipDrawerStore';

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
  correctionPending: OddsCorrectionChange[] | null;
  correctionsAccepted: boolean;
  addSelection: (key: SelectionKey, ev: BetslipEventLike) => void;
  removeSelection: (key: SelectionKey) => void;
  removeSelectionsForGameMarket: (gameId: number, marketId: number) => void;
  clear: () => void;
  setStake: (n: number) => void;
  updateSelectionPrice: (key: SelectionKey, price: number, suspended?: boolean) => void;
  acceptCorrections: () => void;
  toSlipPayload: () => BetslipLike;
  placeBet: (bones?: number) => Promise<void>;
};

export const useBetslipStore = create<BetslipState>((set, get) => ({
  type: BETSLIP_TYPE_SINGLE,
  stake: 1,
  events: {},
  placeStatus: 'idle',
  placeMessage: null,
  correctionPending: null,
  correctionsAccepted: true,

  addSelection: (key, ev) => {
    set((s) => ({
      events: {
        ...s.events,
        [key]: {
          ...ev,
          initialPrice: ev.initialPrice ?? ev.price,
          priceChanged: false,
          suspended: false,
        },
      },
      placeMessage: null,
      correctionPending: null,
      correctionsAccepted: true,
    }));
    if (isBetslipDrawerViewport()) {
      useBetslipDrawerStore.getState().open();
    }
  },

  removeSelection: (key) => {
    set((s) => {
      const next = { ...s.events };
      delete next[key];
      return { events: next, correctionPending: null };
    });
  },

  removeSelectionsForGameMarket: (gameId, marketId) => {
    const prefix = `${gameId}-${marketId}-`;
    set((s) => {
      const next = { ...s.events };
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) delete next[key];
      }
      return { events: next, placeMessage: null, correctionPending: null };
    });
  },

  clear: () =>
    set({
      events: {},
      placeStatus: 'idle',
      placeMessage: null,
      correctionPending: null,
      correctionsAccepted: true,
    }),

  setStake: (n) => set({ stake: Math.max(0, n) }),

  updateSelectionPrice: (key, price, suspended = false) => {
    set((s) => {
      const ev = s.events[key];
      if (!ev) return s;
      const initial = ev.initialPrice ?? ev.price;
      const priceChanged = Math.abs(price - initial) > 0.001;
      return {
        events: {
          ...s.events,
          [key]: {
            ...ev,
            price,
            priceChanged,
            suspended,
          },
        },
        correctionPending: priceChanged ? [{ selectionKey: key, oldPrice: initial, newPrice: price }] : null,
        correctionsAccepted: !priceChanged,
      };
    });
  },

  acceptCorrections: () => {
    set((s) => {
      const next = { ...s.events };
      for (const [key, ev] of Object.entries(next)) {
        next[key] = { ...ev, initialPrice: ev.price, priceChanged: false, suspended: false };
      }
      return {
        events: next,
        correctionPending: null,
        correctionsAccepted: true,
      };
    });
  },

  toSlipPayload: (): BetslipLike => {
    const s = get();
    return {
      type: s.type,
      events: { ...s.events },
      stake: s.stake,
    };
  },

  placeBet: async (bones = 0) => {
    const slip = get().toSlipPayload();
    if (Object.keys(slip.events).length === 0) {
      set({ placeStatus: 'error', placeMessage: 'Add at least one selection.' });
      return;
    }

    const token = useSessionStore.getState().token ?? localStorage.getItem('superbet_token');
    if (!token) {
      set({ placeStatus: 'error', placeMessage: 'Please sign in to place a bet.' });
      return;
    }

    const { correctionsAccepted, correctionPending } = get();
    if (correctionPending?.length && !correctionsAccepted) {
      set({ placeStatus: 'error', placeMessage: 'Accept updated odds before placing.' });
      return;
    }

    set({ placeStatus: 'loading', placeMessage: null });
    try {
      const result = await placeBetSlip(slip, useSessionStore.getState().getAuthHeader(), {
        acceptCorrection: correctionsAccepted,
        bones,
      });

      if (result.correction && result.changes?.length) {
        set((s) => {
          const next = { ...s.events };
          for (const ch of result.changes ?? []) {
            const key = ch.selectionKey ?? Object.keys(next).find((k) => {
              const ev = next[k];
              return ev && Number(ev.eventId) === Number(ch.eventId);
            });
            if (key && next[key]) {
              next[key] = {
                ...next[key],
                price: ch.newPrice,
                priceChanged: true,
              };
            }
          }
          return {
            events: next,
            placeStatus: 'error',
            placeMessage: result.msg ?? 'Odds changed — review and accept updated prices.',
            correctionPending: result.changes ?? null,
            correctionsAccepted: false,
          };
        });
        return;
      }

    if (!result.ok) {
      const msg =
        result.message ??
        result.error ??
        result.msg ??
        (result.code === 12 ? 'Please sign in.' : 'Could not place bet.');
      set({ placeStatus: 'error', placeMessage: msg });
      return;
    }

      set({
        placeStatus: 'success',
        placeMessage: result.message ?? 'Bet accepted.',
        events: {},
        correctionPending: null,
        correctionsAccepted: true,
      });

      window.dispatchEvent(new CustomEvent('superbet:wallet-changed'));
    } catch (e) {
      set({
        placeStatus: 'error',
        placeMessage: e instanceof Error ? e.message : 'Could not place bet.',
      });
    }
  },
}));

export { keyFor };
