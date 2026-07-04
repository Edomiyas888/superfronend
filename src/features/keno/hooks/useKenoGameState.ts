import { useEffect, useState } from 'react';
import { useSessionStore } from '@/features/auth/sessionStore';
import { useAuth } from '@/features/keno/contexts/AuthContext';
import { fetchKenoState, type KenoPublicState } from '@/features/keno/api/kenoApi';
import { subscribeKenoSocket } from '@/features/keno/api/kenoSocket';
import { useKenoWebSocket } from '@/api/config';

const POLL_MS = 1000;
const FALLBACK_POLL_MS = 5000;

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

    const applyState = (data: KenoPublicState) => {
      if (cancelled) return;
      setState(withMyBets(data, userId));
      setError(null);
    };

    const loadHttp = async () => {
      try {
        const headers = token ? getAuthHeader() : {};
        const data = await fetchKenoState(headers);
        applyState(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Keno unavailable');
        }
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

    startPolling(FALLBACK_POLL_MS);

    return () => {
      cancelled = true;
      unsubscribe();
      if (pollInterval) clearInterval(pollInterval);
      setSocketConnected(false);
    };
  }, [getAuthHeader, token, userId, socketEnabled]);

  const roundNo = state?.roundNo ?? null;
  const phase = state?.phase ?? 'betting';
  const countdown = state?.countdown ?? 0;
  const calledNumbers = state?.calledNumbers ?? [];
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
