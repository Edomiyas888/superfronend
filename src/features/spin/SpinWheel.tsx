import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { WHEEL_SEGMENTS, rotationFor } from './spinRules';
import { spinTick } from './spinFx';

const R = 100;
const SLICE = 360 / WHEEL_SEGMENTS.length;
const BULBS = 18;
const SPIN_MS = 6200;
const REDUCED_SPIN_MS = 900;
/** Pulled back before the spin, and overshot (then settled) at the end — both in degrees. */
const WIND_UP = 9;
const OVERSHOOT = 2.2;

function point(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return `${(r * Math.sin(rad)).toFixed(3)} ${(-r * Math.cos(rad)).toFixed(3)}`;
}

function slicePath(i: number) {
  const a0 = i * SLICE - SLICE / 2;
  return `M0 0 L${point(R, a0)} A${R} ${R} 0 0 1 ${point(R, a0 + SLICE)} Z`;
}

function valueSize(value: string) {
  if (value.length <= 2) return 18;
  if (value.length === 3) return 16;
  if (value.length <= 5) return 13;
  return 11;
}

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOut = (t: number) => 1 - (1 - t) ** 4.2;

/** Wheel angle at progress `t`: a small wind-up, a long decelerating run, a settle back. */
function wheelAngle(from: number, target: number, t: number) {
  if (t < 0.07) return from - WIND_UP * easeInOutSine(t / 0.07);
  const u = (t - 0.07) / 0.93;
  const start = from - WIND_UP;
  const peak = target + OVERSHOOT;
  if (u < 0.94) return start + (peak - start) * easeOut(u / 0.94);
  return peak - OVERSHOOT * easeInOutSine((u - 0.94) / 0.06);
}

export type SpinWheelHandle = {
  /** Turn the wheel until slice `index` sits under the pointer. */
  spin: (index: number) => Promise<void>;
};

type Props = {
  spinning: boolean;
  /** Slice that just won — it glows until the next spin. */
  winnerIndex: number | null;
  hubLabel: string;
  hubSub?: string;
  hubDisabled: boolean;
  onHubClick: () => void;
};

const SpinWheel = forwardRef<SpinWheelHandle, Props>(function SpinWheel(
  { spinning, winnerIndex, hubLabel, hubSub, hubDisabled, onHubClick },
  ref
) {
  const discRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<SVGSVGElement>(null);
  const angle = useRef(0);
  const frame = useRef(0);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useImperativeHandle(ref, () => ({
    spin: (index) =>
      new Promise<void>((resolve) => {
        const disc = discRef.current;
        if (!disc) return resolve();
        const from = angle.current;
        const target = rotationFor(index, from, Math.random() * 2 - 1);
        const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const duration = reduced ? REDUCED_SPIN_MS : SPIN_MS;
        const start = performance.now();
        let peg = Math.floor((from - SLICE / 2) / SLICE);

        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const a = reduced ? from + (target - from) * easeOut(t) : wheelAngle(from, target, t);
          disc.style.transform = `rotate(${a}deg)`;

          // A slice edge (and its peg) just passed the pointer: flick it and click.
          const passed = Math.floor((a - SLICE / 2) / SLICE);
          if (passed !== peg) {
            peg = passed;
            spinTick();
            const pointer = pointerRef.current;
            if (pointer) {
              pointer.classList.remove('is-tick');
              void pointer.getBoundingClientRect();
              pointer.classList.add('is-tick');
            }
          }

          if (t < 1) {
            frame.current = requestAnimationFrame(step);
          } else {
            angle.current = target;
            resolve();
          }
        };
        frame.current = requestAnimationFrame(step);
      }),
  }));

  return (
    <div className={`b365-spin-wheel${spinning ? ' is-spinning' : ''}${winnerIndex != null ? ' is-won' : ''}`}>
      <svg className="b365-spin-wheel__frame" viewBox="-100 -100 200 200" aria-hidden>
        <circle r="99.5" fill="url(#spin-rim)" />
        <circle r="96.5" fill="none" stroke="#fff3b0" strokeOpacity="0.35" strokeWidth="0.8" />
        <circle r="91.5" fill="#160f04" />
        {Array.from({ length: BULBS }, (_, i) => (
          <circle
            key={i}
            r="2.6"
            className={`b365-spin-bulb b365-spin-bulb--${i % 2 ? 'b' : 'a'}`}
            transform={`rotate(${(360 / BULBS) * i}) translate(0 -95.2)`}
          />
        ))}
      </svg>

      <div ref={discRef} className="b365-spin-wheel__disc">
        <svg viewBox="-100 -100 200 200" role="img" aria-label="Prize wheel">
          {WHEEL_SEGMENTS.map((s, i) => (
            <g key={s.id} className={`b365-spin-slice b365-spin-slice--${s.tone}${winnerIndex === i ? ' is-winner' : ''}`}>
              <path d={slicePath(i)} fill={`url(#spin-slice-${s.tone})`} />
              <g transform={`rotate(${i * SLICE})`}>
                <use href={`#spin-ico-${s.icon}`} x="-12" y="-90" width="24" height="24" />
                <text y={-56} className="b365-spin-slice__value" fontSize={valueSize(s.value)}>
                  {s.value}
                </text>
                <text y={-43} className="b365-spin-slice__kind">
                  {s.kind}
                </text>
              </g>
            </g>
          ))}
          {WHEEL_SEGMENTS.map((s, i) => (
            <path
              key={`edge-${s.id}`}
              d={`M0 0 L${point(R, i * SLICE - SLICE / 2)}`}
              className="b365-spin-wheel__edge"
            />
          ))}
          {WHEEL_SEGMENTS.map((s, i) => (
            <circle
              key={`peg-${s.id}`}
              r="2.6"
              className="b365-spin-wheel__peg"
              transform={`rotate(${i * SLICE - SLICE / 2}) translate(0 -94)`}
            />
          ))}
          <circle r="99" fill="none" stroke="#3a2600" strokeWidth="2" />
        </svg>
      </div>

      <span className="b365-spin-wheel__gloss" aria-hidden />

      <button
        type="button"
        className="b365-spin-wheel__hub"
        disabled={hubDisabled}
        onClick={onHubClick}
        aria-label={hubSub ? `${hubLabel}, ${hubSub}` : hubLabel}
      >
        <span className="b365-spin-wheel__hub-label">{hubLabel}</span>
        {hubSub ? <span className="b365-spin-wheel__hub-sub">{hubSub}</span> : null}
      </button>

      <svg ref={pointerRef} className="b365-spin-wheel__pointer" viewBox="0 0 40 54" aria-hidden>
        <path d="M20 52 L5.5 16 A15 15 0 1 1 34.5 16 Z" fill="url(#spin-gold)" stroke="#7a4d00" strokeWidth="1.6" strokeLinejoin="round" />
        <circle cx="20" cy="15" r="7" fill="#e11d48" stroke="#7f0d27" strokeWidth="1.2" />
        <ellipse cx="17.5" cy="12" rx="2.6" ry="1.6" fill="#fff" opacity="0.8" />
      </svg>
    </div>
  );
});

export default SpinWheel;
