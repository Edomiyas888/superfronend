import { useEffect, useRef, useState } from 'react';

/**
 * Plays the draw back on Atlas's clock, independent of how the server streams numbers.
 *
 * Atlas timeline (step = seconds since the first ball):
 *   step 0      ball 1 pops up big in the centre
 *   step k      ball k+1 pops up in the centre, ball k flies to its slot   (k = 1..19)
 *   step 20     ball 20 flies to the last slot, counter reads 20
 *   step 21     result popup (YOU WIN / TRY AGAIN), ticket wins revealed
 *
 * The server sends calledNumbers about one per second, so we buffer them and never
 * advance faster than one step per second. If the page opens mid-draw, the balls already
 * drawn are placed instantly and playback continues from the newest one.
 */

export const DRAW_BALL_COUNT = 20;
export const DRAW_STEP_MS = 1000;
export const DRAW_RESULT_STEP = DRAW_BALL_COUNT + 1;
// Joining with more numbers than this already drawn counts as a late join.
const LATE_JOIN_THRESHOLD = 3;

type Playback = {
  roundNo: number | null;
  step: number;
  /** Balls (1-based count) placed without animation because they were drawn before we joined. */
  instant: number;
};

const IDLE: Playback = { roundNo: null, step: -1, instant: 0 };

function startPlayback(roundNo: number | null, available: number): Playback {
  if (available > LATE_JOIN_THRESHOLD) {
    const caughtUp = Math.min(available, DRAW_BALL_COUNT) - 1;
    return { roundNo, step: caughtUp, instant: caughtUp };
  }
  return { roundNo, step: -1, instant: 0 };
}

export function useKenoDrawPlayback(
  roundNo: number | null,
  calledNumbers: number[],
  isDrawing: boolean,
) {
  const available = Math.min(calledNumbers.length, DRAW_BALL_COUNT);
  const [playback, setPlayback] = useState<Playback>(IDLE);
  const lastStepAt = useRef(0);

  // Start (or restart) playback when a draw begins; reset when it ends.
  let current = playback;
  if (isDrawing && playback.roundNo !== roundNo) {
    current = startPlayback(roundNo, available);
    setPlayback(current);
  } else if (!isDrawing && playback !== IDLE) {
    current = IDLE;
    setPlayback(IDLE);
  }

  const { step } = current;
  const canAdvance =
    isDrawing &&
    step < DRAW_RESULT_STEP &&
    (step >= DRAW_BALL_COUNT - 1 ? available >= DRAW_BALL_COUNT : available >= step + 2);

  useEffect(() => {
    if (!canAdvance) return undefined;
    const wait = step < 0 ? 0 : Math.max(0, lastStepAt.current + DRAW_STEP_MS - performance.now());
    const timer = setTimeout(() => {
      lastStepAt.current = performance.now();
      setPlayback((prev) => ({ ...prev, step: prev.step + 1 }));
    }, wait);
    return () => clearTimeout(timer);
  }, [canAdvance, step]);

  // When we join late the newest ball is already on screen, so its 1s starts now.
  useEffect(() => {
    if (current.instant > 0) lastStepAt.current = performance.now();
  }, [current.roundNo, current.instant]);

  const shownCount = step < 0 ? 0 : Math.min(step + 1, DRAW_BALL_COUNT);
  const movedCount = Math.max(0, Math.min(step, DRAW_BALL_COUNT));

  return {
    /** Balls visible in the draw area (the newest one sits big in the centre until it moves). */
    shownCount,
    /** Balls that have flown to their slot; this is also what the N / 20 counter shows. */
    movedCount,
    instantCount: current.instant,
    drawnNumbers: calledNumbers.slice(0, shownCount),
    resultReady: step >= DRAW_RESULT_STEP,
  };
}
