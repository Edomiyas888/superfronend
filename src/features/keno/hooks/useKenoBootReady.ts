import { useEffect, useRef, useState } from 'react';
import { preloadKenoAssets } from '../utils/preloadKenoAssets';

// One full sweep of the loader, so a fast boot doesn't just flash it.
const MIN_SPLASH_MS = 1000;
const MAX_BOOT_MS = 9000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/** True once auth, the first game state and the key assets are in (or MAX_BOOT_MS has passed). */
export function useKenoBootReady(authLoading: boolean, gameReady: boolean): boolean {
  const [ready, setReady] = useState(false);
  const booting = useRef(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const forceReadyTimer = window.setTimeout(() => setReady(true), MAX_BOOT_MS);
    return () => window.clearTimeout(forceReadyTimer);
  }, []);

  useEffect(() => {
    if (ready || booting.current) return;
    if (authLoading || !gameReady) return;

    booting.current = true;
    void (async () => {
      await preloadKenoAssets();
      await delay(Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt.current)));
      setReady(true);
    })();
  }, [authLoading, gameReady, ready]);

  return ready;
}
