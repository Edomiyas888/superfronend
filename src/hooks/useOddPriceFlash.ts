import { useEffect, useRef, useState } from 'react';

export type OddFlashState = { dir: 'up' | 'down'; key: number } | null;

/**
 * When `price` changes vs the previous render, emits a short-lived flash state
 * for green ↑ / red ↓ (clears after ~2.8s).
 */
export function useOddPriceFlash(price: number | undefined | null): OddFlashState {
  const prevRef = useRef<number | undefined>();
  const keyRef = useRef(0);
  const [flash, setFlash] = useState<OddFlashState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (price == null || !Number.isFinite(price)) return;
    const prev = prevRef.current;
    prevRef.current = price;
    if (prev == null || !Number.isFinite(prev)) return;
    if (Math.abs(prev - price) < 1e-6) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    const dir = price > prev ? 'up' : 'down';
    keyRef.current += 1;
    setFlash({ dir, key: keyRef.current });
    timerRef.current = setTimeout(() => setFlash(null), 2800);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [price]);

  return flash;
}
