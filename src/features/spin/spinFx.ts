import { getTelegramWebApp, isTelegramMiniApp } from '../../lib/telegram/webApp';

/**
 * Wheel feedback: a peg click and a light haptic on every slice the pointer passes, and a
 * chime + success haptic on the prize. Sounds are synthesized, so there are no audio files.
 */

const MUTE_KEY = 'spin_muted';
/** Pegs pass faster than anyone can feel; keep haptics and clicks to a readable rhythm. */
const MIN_TICK_GAP_MS = 45;

let ctx: AudioContext | null = null;
let lastTick = 0;
let muted = readMuted();

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isSpinMuted() {
  return muted;
}

export function setSpinMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    // Storage blocked — the choice just won't persist.
  }
}

/** Must run inside the tap that starts the spin: browsers only allow audio after a gesture. */
export function unlockSpinAudio() {
  if (muted) return;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
}

function haptic(kind: 'tick' | 'win') {
  if (isTelegramMiniApp()) {
    const h = getTelegramWebApp().HapticFeedback;
    if (kind === 'tick') h.impactOccurred('light');
    else h.notificationOccurred('success');
    return;
  }
  navigator.vibrate?.(kind === 'tick' ? 6 : [30, 40, 60]);
}

function tone(freq: number, start: number, length: number, volume: number, type: OscillatorType) {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

export function spinTick() {
  const now = performance.now();
  if (now - lastTick < MIN_TICK_GAP_MS) return;
  lastTick = now;
  haptic('tick');
  if (muted || !ctx) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1500, t);
  osc.frequency.exponentialRampToValueAtTime(500, t + 0.03);
  gain.gain.setValueAtTime(0.09, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.05);
}

/** Rising chime; the jackpot gets a longer fanfare. */
export function spinWin(big: boolean) {
  haptic('win');
  if (muted || !ctx) return;
  const t = ctx.currentTime + 0.02;
  const notes = big ? [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568] : [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((f, i) => tone(f, t + i * 0.085, big ? 0.6 : 0.4, 0.12, 'sine'));
  tone(2093, t + notes.length * 0.085, 0.5, 0.05, 'triangle');
}
