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
 * The server sends all 20 numbers (drawNumbers) as soon as betting closes, like Atlas, so
 * the balls run on our own clock and a slow connection can't stall them. calledNumbers
 * (about one per second) says how far the server's draw is; older servers send only that,
 * in which case we buffer it and never advance faster than one step per second. If the page
 * opens mid-draw, the balls already drawn are placed instantly and playback continues from
 * the newest one.
 *
 * The server starts the next round shortly after ball 20, so once all 20 numbers are
 * buffered playback finishes on its own: the result stays up for RESULT_HOLD_MS and then
 * the stage hands back to betting.
 */

export const DRAW_BALL_COUNT = 20;
export const DRAW_STEP_MS = 1000;
export const DRAW_RESULT_STEP = DRAW_BALL_COUNT + 1;
const RESULT_HOLD_MS = 2000;
// Joining with more numbers than this already drawn counts as a late join.
const LATE_JOIN_THRESHOLD = 3;

type Playback = {
  roundNo: number | null;
  step: number;
  /** Balls (1-based count) placed without animation because they were drawn before we joined. */
  instant: number;
  /** Numbers buffered for this round; kept after the server moves on to the next round. */
  numbers: number[];
  /** The result has been on screen for RESULT_HOLD_MS. */
  done: boolean;
};

const IDLE: Playback = { roundNo: null, step: -1, instant: 0, numbers: [], done: false };

function startPlayback(roundNo: number | null, numbers: number[], revealed: number): Playback {
  if (revealed > LATE_JOIN_THRESHOLD) {
    const caughtUp = Math.min(revealed, DRAW_BALL_COUNT) - 1;
    return { roundNo, step: caughtUp, instant: caughtUp, numbers, done: false };
  }
  return { roundNo, step: -1, instant: 0, numbers, done: false };
}

export function useKenoDrawPlayback(
  roundNo: number | null,
  calledNumbers: number[],
  isDrawing: boolean,
  drawNumbers: number[] = [],
) {
  const known = drawNumbers.length > calledNumbers.length ? drawNumbers : calledNumbers;
  const [playback, setPlayback] = useState<Playback>(IDLE);
  const lastStepAt = useRef(0);

  // Start (or restart) playback when a draw begins, buffer numbers while it runs, and
  // let it play out after the server has moved on once every ball is known.
  let current = playback;
  if (isDrawing && playback.roundNo !== roundNo) {
    current = startPlayback(roundNo, known, calledNumbers.length);
  } else if (isDrawing && known.length > playback.numbers.length) {
    current = { ...playback, numbers: known };
  } else if (!isDrawing && playback !== IDLE) {
    const canFinish = playback.numbers.length >= DRAW_BALL_COUNT && !playback.done;
    if (!canFinish) current = IDLE;
  }
  if (current !== playback) setPlayback(current);

  const { step, numbers } = current;
  const active = current.roundNo !== null;
  const available = Math.min(numbers.length, DRAW_BALL_COUNT);
  const canAdvance =
    active &&
    step < DRAW_RESULT_STEP &&
    (step >= DRAW_BALL_COUNT - 1 ? available >= DRAW_BALL_COUNT : available >= step + 2);
  const resultReady = step >= DRAW_RESULT_STEP;

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

  useEffect(() => {
    if (!resultReady) return undefined;
    const timer = setTimeout(() => {
      setPlayback((prev) => (prev.roundNo === current.roundNo ? { ...prev, done: true } : prev));
    }, RESULT_HOLD_MS);
    return () => clearTimeout(timer);
  }, [resultReady, current.roundNo]);

  const shownCount = step < 0 ? 0 : Math.min(step + 1, DRAW_BALL_COUNT);
  const movedCount = Math.max(0, Math.min(step, DRAW_BALL_COUNT));

  return {
    /** The draw stage is on screen (the server's draw, or ours finishing after it). */
    active,
    roundNo: current.roundNo,
    /** Every number buffered for the round being played. */
    numbers,
    /** Balls visible in the draw area (the newest one sits big in the centre until it moves). */
    shownCount,
    /** Balls that have flown to their slot; this is also what the N / 20 counter shows. */
    movedCount,
    instantCount: current.instant,
    drawnNumbers: numbers.slice(0, shownCount),
    resultReady,
  };
}
