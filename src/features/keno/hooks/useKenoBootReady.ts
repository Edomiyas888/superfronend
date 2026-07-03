import { useEffect, useRef, useState } from 'react';
import { preloadKenoAssets } from '../utils/preloadKenoAssets';

const MIN_SPLASH_MS = 1400;
const FADE_OUT_MS = 480;
const MAX_BOOT_MS = 9000;

export type KenoBootPhase = 'loading' | 'exiting' | 'done';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function useKenoBootReady(authLoading: boolean, gameReady: boolean): KenoBootPhase {
  const [phase, setPhase] = useState<KenoBootPhase>('loading');
  const startedAt = useRef(Date.now());
  const exitStarted = useRef(false);

  useEffect(() => {
    if (phase !== 'loading' || exitStarted.current) return;

    let cancelled = false;

    const finishBoot = async () => {
      if (exitStarted.current || cancelled) return;
      exitStarted.current = true;

      const elapsed = Date.now() - startedAt.current;
      const remainingMin = Math.max(0, MIN_SPLASH_MS - elapsed);
      if (remainingMin > 0) {
        await delay(remainingMin);
      }
      if (cancelled) return;

      setPhase('exiting');
      await delay(FADE_OUT_MS);
      if (cancelled) return;
      setPhase('done');
    };

    const maxTimer = window.setTimeout(() => {
      void finishBoot();
    }, MAX_BOOT_MS);

    const tryFinish = async () => {
      if (authLoading || !gameReady) return;
      await preloadKenoAssets();
      await finishBoot();
    };

    void tryFinish();

    return () => {
      cancelled = true;
      window.clearTimeout(maxTimer);
    };
  }, [authLoading, gameReady, phase]);

  return phase;
}
