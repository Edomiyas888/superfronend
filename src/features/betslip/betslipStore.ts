import { create } from 'zustand';
import {
  BETSLIP_TYPE_SINGLE,
  BETSLIP_TYPE_MULTIPLE,
  type BetslipEventLike,
  type BetslipLike,
  type OddsCorrectionChange,
} from '../../api/placeBet';
import { placeBetSlip } from '../bets/betsApi';
import { useSessionStore } from '../auth/sessionStore';
import type { LiveGameDisplay } from '../../utils/matchLiveDisplay';
import { MAX_POSSIBLE_WIN, MIN_STAKE } from '../../config/bettingLimits';

export type SelectionKey = string;

const BETSLIP_STORAGE_KEY = 'superbet_betslip';

type PersistedBetslip = {
  stake: number;
  events: Record<string, BetslipEventLike>;
};

function loadPersistedBetslip(): PersistedBetslip {
  if (typeof localStorage === 'undefined') {
    return { stake: MIN_STAKE, events: {} };
  }
  try {
    const raw = localStorage.getItem(BETSLIP_STORAGE_KEY);
    if (!raw) return { stake: MIN_STAKE, events: {} };
    const parsed = JSON.parse(raw) as Partial<PersistedBetslip>;
    const stake = Number(parsed.stake);
    const events = parsed.events;
    if (!events || typeof events !== 'object' || Array.isArray(events)) {
      return {
        stake: Number.isFinite(stake) && stake >= MIN_STAKE ? stake : MIN_STAKE,
        events: {},
      };
    }
    const cleaned: Record<string, BetslipEventLike> = {};
    for (const [key, ev] of Object.entries(events)) {
      if (!ev || typeof ev !== 'object') continue;
      const gameId = Number(ev.gameId);
      const eventId = Number(ev.eventId);
      const marketId = Number(ev.marketId);
      const price = Number(ev.price ?? ev.initialPrice);
      if (!gameId || !eventId || !marketId || !Number.isFinite(price) || price <= 1) continue;
      cleaned[key] = {
        ...ev,
        gameId,
        eventId,
        marketId,
        price,
        initialPrice: Number(ev.initialPrice ?? ev.price) || price,
        priceChanged: Boolean(ev.priceChanged),
        suspended: Boolean(ev.suspended),
      };
    }
    return {
      stake: Number.isFinite(stake) && stake >= MIN_STAKE ? stake : MIN_STAKE,
      events: cleaned,
    };
  } catch {
    return { stake: MIN_STAKE, events: {} };
  }
}

function savePersistedBetslip(data: PersistedBetslip) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (Object.keys(data.events).length === 0) {
      localStorage.removeItem(BETSLIP_STORAGE_KEY);
      return;
    }
    localStorage.setItem(BETSLIP_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore quota / private mode */
  }
}

function dedupeEventsByGame(events: Record<string, BetslipEventLike>): Record<string, BetslipEventLike> {
  const seen = new Set<number>();
  const next: Record<string, BetslipEventLike> = {};
  for (const [key, ev] of Object.entries(events)) {
    const gameId = Number(ev.gameId);
    if (!gameId || seen.has(gameId)) continue;
    seen.add(gameId);
    next[key] = ev;
  }
  return next;
}

function hasSelectionForGame(events: Record<string, BetslipEventLike>, gameId: number, exceptKey?: string) {
  return Object.entries(events).some(
    ([key, ev]) => key !== exceptKey && Number(ev.gameId) === Number(gameId)
  );
}

function keyFor(gameId: number | string, marketId: number, eventId: number): SelectionKey {
  return `${gameId}-${marketId}-${eventId}`;
}

const persistedRaw = loadPersistedBetslip();
const persisted = {
  stake: persistedRaw.stake,
  events: dedupeEventsByGame(persistedRaw.events),
};

type BetslipState = {
  type: number;
  stake: number;
  events: Record<string, BetslipEventLike>;
  liveByGameId: Record<string, LiveGameDisplay>;
  placeStatus: 'idle' | 'loading' | 'success' | 'error';
  placeMessage: string | null;
  correctionPending: OddsCorrectionChange[] | null;
  correctionsAccepted: boolean;
  selectionError: string | null;
  addSelection: (key: SelectionKey, ev: BetslipEventLike) => boolean;
  removeSelection: (key: SelectionKey) => void;
  removeSelectionsForGameMarket: (gameId: number, marketId: number) => void;
  removeSelectionsForGame: (gameId: number) => void;
  clearSelectionError: () => void;
  clear: () => void;
  setStake: (n: number) => void;
  updateSelectionPrice: (key: SelectionKey, price: number, suspended?: boolean) => void;
  setLiveDisplay: (gameId: number | string, display: LiveGameDisplay | null) => void;
  acceptCorrections: () => void;
  toSlipPayload: () => BetslipLike;
  placeBet: (bones?: number) => Promise<void>;
};

export const useBetslipStore = create<BetslipState>((set, get) => ({
  type: BETSLIP_TYPE_SINGLE,
  stake: persisted.stake,
  events: persisted.events,
  liveByGameId: {},
  placeStatus: 'idle',
  placeMessage: null,
  correctionPending: null,
  correctionsAccepted: true,
  selectionError: null,

  addSelection: (key, ev) => {
    const gameId = Number(ev.gameId);
    if (!gameId) return false;

    const current = get().events;
    if (hasSelectionForGame(current, gameId, key)) {
      set({
        selectionError: 'Only one selection per match is allowed. Remove the existing pick first.',
      });
      return false;
    }

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
      selectionError: null,
    }));
    return true;
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
      return { events: next, placeMessage: null, correctionPending: null, selectionError: null };
    });
  },

  removeSelectionsForGame: (gameId) => {
    const prefix = `${gameId}-`;
    set((s) => {
      const next = { ...s.events };
      for (const key of Object.keys(next)) {
        if (key.startsWith(prefix)) delete next[key];
      }
      return { events: next, placeMessage: null, correctionPending: null, selectionError: null };
    });
  },

  clearSelectionError: () => set({ selectionError: null }),

  clear: () => {
    savePersistedBetslip({ stake: get().stake, events: {} });
    set({
      events: {},
      liveByGameId: {},
      placeStatus: 'idle',
      placeMessage: null,
      correctionPending: null,
      correctionsAccepted: true,
    });
  },

  setStake: (n) => set({ stake: Math.max(0, n) }),

  updateSelectionPrice: (key, price, suspended = false) => {
    set((s) => {
      const ev = s.events[key];
      if (!ev) return s;
      if (!suspended && Math.abs(price - ev.price) <= 0.001) return s;

      const initial = ev.initialPrice ?? ev.price;
      const nextPrice = suspended ? ev.price : price;

      const nextEvents = {
        ...s.events,
        [key]: {
          ...ev,
          price: nextPrice,
          priceChanged: !suspended && Math.abs(nextPrice - initial) > 0.001,
          suspended,
        },
      };

      const correctionPending = Object.entries(nextEvents)
        .filter(([, e]) => e.priceChanged && Math.abs(e.price - (e.initialPrice ?? e.price)) > 0.001)
        .map(([selectionKey, e]) => ({
          selectionKey,
          oldPrice: e.initialPrice ?? e.price,
          newPrice: e.price,
        }));

      return {
        events: nextEvents,
        correctionPending: correctionPending.length > 0 ? correctionPending : null,
        correctionsAccepted: correctionPending.length === 0,
      };
    });
  },

  setLiveDisplay: (gameId, display) => {
    const key = String(gameId);
    set((s) => {
      const current = s.liveByGameId[key] ?? null;
      if (!display?.isLive) {
        if (!current) return s;
        const next = { ...s.liveByGameId };
        delete next[key];
        return { liveByGameId: next };
      }
      if (
        current?.isLive === display.isLive &&
        current?.homeScore === display.homeScore &&
        current?.awayScore === display.awayScore &&
        current?.liveMatchTime === display.liveMatchTime
      ) {
        return s;
      }
      return { liveByGameId: { ...s.liveByGameId, [key]: display } };
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
    const count = Object.keys(s.events).length;
    return {
      type: count > 1 ? BETSLIP_TYPE_MULTIPLE : BETSLIP_TYPE_SINGLE,
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

    const gameIds = Object.values(slip.events).map((ev) => Number(ev.gameId));
    if (new Set(gameIds).size !== gameIds.length) {
      set({
        placeStatus: 'error',
        placeMessage: 'Only one selection per match is allowed.',
      });
      return;
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const hasStaleSelection = Object.values(slip.events).some(
      (ev) => ev.suspended || (Number.isFinite(ev.dateofmatch) && ev.dateofmatch <= nowSec)
    );
    if (hasStaleSelection) {
      set({
        placeStatus: 'error',
        placeMessage: 'One or more selections have already started or finished. Remove them and try again.',
      });
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

    if (slip.stake < MIN_STAKE) {
      set({ placeStatus: 'error', placeMessage: `Minimum stake is ${MIN_STAKE}.` });
      return;
    }

    const ids = Object.keys(slip.events);
    const isAcca = ids.length > 1;
    const combinedOdds = ids.reduce((acc, id) => acc * (slip.events[id]?.price || 1), 1);
    const possibleWin = isAcca
      ? slip.stake * combinedOdds
      : ids.reduce((acc, id) => {
          const ev = slip.events[id];
          if (!ev) return acc;
          const s =
            Number.isFinite(Number(ev.singleStake)) && Number(ev.singleStake) > 0
              ? Number(ev.singleStake)
              : slip.stake;
          return acc + s * (ev.price || 1);
        }, 0);
    if (possibleWin > MAX_POSSIBLE_WIN) {
      set({
        placeStatus: 'error',
        placeMessage: `Maximum return is ${MAX_POSSIBLE_WIN.toLocaleString('en-US')}. Reduce stake or remove selections.`,
      });
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
      window.dispatchEvent(new CustomEvent('superbet:my-bets-changed'));
    } catch (e) {
      set({
        placeStatus: 'error',
        placeMessage: e instanceof Error ? e.message : 'Could not place bet.',
      });
    }
  },
}));

useBetslipStore.subscribe((state, prev) => {
  if (state.stake === prev.stake && state.events === prev.events) return;
  savePersistedBetslip({ stake: state.stake, events: state.events });
});

export { keyFor };
