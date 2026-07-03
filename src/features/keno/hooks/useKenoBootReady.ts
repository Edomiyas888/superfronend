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
  const bootFinished = useRef(false);
  const booting = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    if (bootFinished.current || booting.current) return;
    if (authLoading || !gameReady) return;

    booting.current = true;

    const completeBoot = async () => {
      const elapsed = Date.now() - startedAt.current;
      const remainingMin = Math.max(0, MIN_SPLASH_MS - elapsed);
      if (remainingMin > 0) {
        await delay(remainingMin);
      }
      if (bootFinished.current) return;

      setPhase('exiting');
      await delay(FADE_OUT_MS);
      if (bootFinished.current) return;

      bootFinished.current = true;
      setPhase('done');
    };

    void (async () => {
      try {
        await preloadKenoAssets();
        await completeBoot();
      } finally {
        booting.current = false;
      }
    })();

    const forceDoneTimer = window.setTimeout(() => {
      if (bootFinished.current) return;
      bootFinished.current = true;
      setPhase('done');
    }, MAX_BOOT_MS);

    return () => {
      window.clearTimeout(forceDoneTimer);
    };
  }, [authLoading, gameReady]);

  return phase;
};
