import { useEffect, useRef, useState } from 'react';

const TICK_DURATION_MS = 780;

/** Fires a one-shot centered tick when an odd transitions from unselected → selected. */
export function useOddSelectPulse(selected: boolean) {
  const prevSelected = useRef(selected);
  const [pulseKey, setPulseKey] = useState(0);
  const [pulsing, setPulsing] = useState(false);
  const [tickVisible, setTickVisible] = useState(false);

  useEffect(() => {
    if (selected && !prevSelected.current) {
      setPulseKey((key) => key + 1);
      setPulsing(true);
      setTickVisible(true);
      const timer = window.setTimeout(() => {
        setPulsing(false);
        setTickVisible(false);
      }, TICK_DURATION_MS);
      prevSelected.current = selected;
      return () => window.clearTimeout(timer);
    }
    prevSelected.current = selected;
  }, [selected]);

  return { pulseKey, pulsing, tickVisible };
}
