import type { OddFlashState } from '../hooks/useOddPriceFlash';

type Props = {
  flash: OddFlashState;
  /** Extra class on the wrapper (e.g. b365-mm-odd-flash-wrap) */
  className?: string;
};

/** Green ↑ / red ↓ that pulses when `flash` is set; reserve space when idle to limit layout shift */
export default function OddsFlashArrow({ flash, className = '' }: Props) {
  return (
    <span className={`b365-odd-flash-slot ${className}`.trim()} aria-hidden>
      {flash ? (
        <span
          key={flash.key}
          className={`b365-odd-flash-arrow b365-odd-flash-arrow--${flash.dir}`}
        >
          {flash.dir === 'up' ? '↑' : '↓'}
        </span>
      ) : null}
    </span>
  );
}
