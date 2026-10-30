import { useEffect, useState } from 'react';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useAuth } from '@/features/keno/contexts/AuthContext';
import { fetchKenoState, type KenoPublicState } from '@/features/keno/api/kenoApi';
import { subscribeKenoSocket } from '@/features/keno/api/kenoSocket';
import { useKenoWebSocket } from '@/api/config';

const POLL_MS = 1000;
// A socket can go quiet without closing on a weak connection; fetch over HTTP after this long.
const QUIET_SOCKET_MS = 2000;
// The API occasionally answers with an older round; drop a few of those before trusting them.
const MAX_STALE_SKIPS = 3;
const PHASE_ORDER = { betting: 0, drawing: 1, settled: 2 } as const;

/** Where a state sits in the game's timeline, so late responses can be told apart from new ones. */
function progressOf(state: KenoPublicState): [number, number, number] {
  return [state.roundNo, PHASE_ORDER[state.phase] ?? 0, state.calledNumbers?.length ?? 0];
}

function isBehind(
  [round, phase, called]: [number, number, number],
  [latestRound, latestPhase, latestCalled]: [number, number, number],
) {
  if (round !== latestRound) return round < latestRound;
  if (phase !== latestPhase) return phase < latestPhase;
  return called < latestCalled;
}

function withMyBets(state: KenoPublicState, userId: string | null): KenoPublicState {
  if (!userId) {
    return { ...state, myBets: state.myBets ?? [] };
  }
  const myBets = state.allBets.filter((bet) => bet.userId === userId);
  return { ...state, myBets };
}

export function useKenoGameState() {
  const getAuthHeader = useSessionStore((s) => s.getAuthHeader);
  const token = useSessionStore((s) => s.token);
  const { currentUser } = useAuth();
  const userId = currentUser?.uid ?? null;
  const socketEnabled = useKenoWebSocket();

  const [state, setState] = useState<KenoPublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollInterval: ReturnType<typeof setInterval> | null = null;
    let latest: [number, number, number] | null = null;
    let staleSkips = 0;
    let lastStateAt = 0;
    let httpInFlight = false;

    const applyState = (data: KenoPublicState) => {
      if (cancelled) return;
      lastStateAt = Date.now();
      // Socket and HTTP answers can arrive out of order on a slow connection.
      const progress = progressOf(data);
      if (latest && isBehind(progress, latest) && staleSkips < MAX_STALE_SKIPS) {
        staleSkips += 1;
        return;
      }
      latest = progress;
      staleSkips = 0;
      setState(withMyBets(data, userId));
      setError(null);
    };

    const loadHttp = async () => {
      // Don't stack requests on a slow connection; the next tick tries again.
      if (httpInFlight) return;
      httpInFlight = true;
      try {
        const headers = token ? getAuthHeader() : {};
        const data = await fetchKenoState(headers);
        applyState(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Keno unavailable');
        }
      } finally {
        httpInFlight = false;
      }
    };

    const startPolling = (intervalMs: number) => {
      if (pollInterval) clearInterval(pollInterval);
      pollInterval = setInterval(() => void loadHttp(), intervalMs);
    };

    void loadHttp();

    if (!socketEnabled) {
      startPolling(POLL_MS);
      return () => {
        cancelled = true;
        if (pollInterval) clearInterval(pollInterval);
      };
    }

    const unsubscribe = subscribeKenoSocket({
      onState: (data) => applyState(data),
      onConnect: () => {
        if (cancelled) return;
        setSocketConnected(true);
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
      },
      onDisconnect: () => {
        if (cancelled) return;
        setSocketConnected(false);
        if (!pollInterval) {
          startPolling(POLL_MS);
        }
      },
      onError: () => {
        if (cancelled) return;
        if (!pollInterval) {
          startPolling(POLL_MS);
        }
      },
    });

    const quietCheck = setInterval(() => {
      if (Date.now() - lastStateAt > QUIET_SOCKET_MS) void loadHttp();
    }, POLL_MS);

    return () => {
      cancelled = true;
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      clearInterval(quietCheck);
      setSocketConnected(false);
    };
  }, [getAuthHeader, token, userId, socketEnabled]);

  const roundNo = state?.roundNo ?? null;
  const phase = state?.phase ?? 'betting';
  const countdown = state?.countdown ?? 0;
  const calledNumbers = state?.calledNumbers ?? [];
  const drawNumbers = state?.drawNumbers ?? [];
  const allBets = state?.allBets ?? [];
  const roundsData = state?.roundsHistory ?? {};
  const simulatedCount = state?.simulatedCount ?? 0;
  const displayedTotalPlayers = state?.displayedTotalPlayers ?? 0;

  const selfBets = userId
    ? allBets.filter((b) => b.userId === userId)
    : state?.myBets ?? [];

  return {
    state,
    error,
    socketConnected,
    roundNo,
    phase,
    countdown,
    calledNumbers,
    drawNumbers,
    allBets,
    selfBets,
    otherBets: allBets.filter((b) => b.userId !== userId),
    fakePlayers: state?.marketingBets ?? [],
    roundsData,
    simulatedCount,
    displayedTotalPlayers,
    userId,
  };
}
