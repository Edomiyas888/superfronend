import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../features/auth/sessionStore';
import { mapFetchErrorMessage } from '../lib/fetchWithRetry';
import {
  getTelegramInitData,
  getTelegramStartParam,
  getTelegramUserLabel,
  initTelegramWebApp,
  isTelegramMiniApp,
} from '../lib/telegram/webApp';

type Props = {
  children: ReactNode;
};

function routeFromStartParam(startParam: string): string | null {
  const p = startParam.trim();
  if (!p) return null;
  if (p.startsWith('match_')) {
    const gameId = p.slice('match_'.length);
    if (/^\d+$/.test(gameId)) return `/match/${gameId}`;
  }
  if (p === 'wallet' || p === 'deposit') return '/wallet?tab=deposit';
  if (p === 'my-bets' || p === 'bets') return '/my-bets';
  if (p === 'live') return '/live';
  return null;
}

export default function TelegramProvider({ children }: Props) {
  const navigate = useNavigate();
  const loginWithTelegram = useSessionStore((s) => s.loginWithTelegram);
  const hydrate = useSessionStore((s) => s.hydrate);
  const inTma = isTelegramMiniApp();
  const [ready, setReady] = useState(!inTma);
  const [bootError, setBootError] = useState<string | null>(null);
  const [bootAttempt, setBootAttempt] = useState(0);

  const bootTelegram = useCallback(async () => {
    const initData = getTelegramInitData();
    try {
      if (initData) {
        const result = await loginWithTelegram(initData);
        setBootError(null);
        const startParam = result.startParam ?? getTelegramStartParam();
        const route = startParam ? routeFromStartParam(startParam) : null;
        if (route) navigate(route, { replace: true });
      } else {
        await hydrate();
        setBootError('Open Super Bet from the Telegram bot menu to sign in.');
      }
    } catch (e) {
      await hydrate();
      const msg = mapFetchErrorMessage(e, 'Telegram sign-in failed.');
      if (!useSessionStore.getState().username) {
        setBootError(msg);
      } else {
        setBootError(null);
      }
    } finally {
      setReady(true);
    }
  }, [hydrate, loginWithTelegram, navigate]);

  useEffect(() => {
    if (!inTma) return;

    initTelegramWebApp();
    setReady(false);
    void bootTelegram();
  }, [bootTelegram, bootAttempt, inTma]);

  if (!ready) {
    return (
      <div className="tma-boot">
        <p>{inTma ? 'Signing in with Telegram…' : 'Loading…'}</p>
      </div>
    );
  }

  if (bootError && inTma && !useSessionStore.getState().username) {
    return (
      <div className="tma-boot tma-boot--error">
        <p>{bootError}</p>
        {getTelegramUserLabel() ? (
          <p className="tma-boot__user">{getTelegramUserLabel()}</p>
        ) : null}
        <button
          type="button"
          className="tma-boot__retry"
          onClick={() => {
            setReady(false);
            setBootAttempt((n) => n + 1);
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  return children;
}
