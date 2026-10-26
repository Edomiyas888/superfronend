import type { SpinIcon } from './spinRules';

/**
 * Shared gradients and prize pictures for the wheel and the win card. Rendered once per page;
 * every other SVG references them with `url(#…)` and `<use href="#spin-ico-…">`.
 */
export default function SpinSprite() {
  return (
    <svg className="b365-spin-sprite" aria-hidden focusable="false">
      <defs>
        <linearGradient id="spin-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6c4" />
          <stop offset="0.38" stopColor="#ffd34d" />
          <stop offset="0.7" stopColor="#c98a00" />
          <stop offset="1" stopColor="#ffe27a" />
        </linearGradient>
        <linearGradient id="spin-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3b0" />
          <stop offset="0.25" stopColor="#e3a91c" />
          <stop offset="0.5" stopColor="#8a5a00" />
          <stop offset="0.75" stopColor="#f5c542" />
          <stop offset="1" stopColor="#7a4d00" />
        </linearGradient>
        <radialGradient id="spin-slice-base" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#1f8a4c" />
          <stop offset="1" stopColor="#0b3d22" />
        </radialGradient>
        <radialGradient id="spin-slice-alt" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#24302b" />
          <stop offset="1" stopColor="#0c1210" />
        </radialGradient>
        <radialGradient id="spin-slice-big" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#f0ff8a" />
          <stop offset="1" stopColor="#8fc400" />
        </radialGradient>
        <radialGradient id="spin-slice-grand" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#fff1a6" />
          <stop offset="0.7" stopColor="#f7b500" />
          <stop offset="1" stopColor="#b97800" />
        </radialGradient>
        <radialGradient id="spin-slice-keno" cx="0" cy="0" r="100" gradientUnits="userSpaceOnUse">
          <stop offset="0.15" stopColor="#ff5a5f" />
          <stop offset="1" stopColor="#8f0f1c" />
        </radialGradient>
        <linearGradient id="spin-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b8ffe4" />
          <stop offset="0.5" stopColor="#2fd394" />
          <stop offset="1" stopColor="#0b7a52" />
        </linearGradient>
        <radialGradient id="spin-ball" cx="0.35" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.6" stopColor="#f1f1f1" />
          <stop offset="1" stopColor="#b9b9b9" />
        </radialGradient>

        <symbol id="spin-ico-coin" viewBox="0 0 48 48">
          <circle cx="24" cy="25" r="19" fill="#9a6a00" />
          <circle cx="24" cy="23" r="19" fill="url(#spin-gold)" stroke="#9a6a00" strokeWidth="1.5" />
          <circle cx="24" cy="23" r="13.5" fill="none" stroke="#fff3b0" strokeOpacity="0.75" strokeWidth="1.6" />
          <path
            d="M24 14.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8L24 27.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z"
            fill="#b07800"
          />
          <ellipse cx="16" cy="13" rx="6" ry="2.6" fill="#fff" opacity="0.5" transform="rotate(-35 16 13)" />
        </symbol>

        <symbol id="spin-ico-coins" viewBox="0 0 48 48">
          {[34, 27, 20, 13].map((y) => (
            <g key={y}>
              <ellipse cx="24" cy={y + 3.5} rx="16" ry="6" fill="#9a6a00" />
              <rect x="8" y={y} width="32" height="3.5" fill="#d99a00" />
              <ellipse cx="24" cy={y} rx="16" ry="6" fill="url(#spin-gold)" stroke="#9a6a00" strokeWidth="1" />
            </g>
          ))}
          <ellipse cx="17" cy="11.5" rx="5" ry="1.8" fill="#fff" opacity="0.55" />
        </symbol>

        <symbol id="spin-ico-bag" viewBox="0 0 48 48">
          <path d="M18 5c2 2.5 10 2.5 12 0l-2.5 8h-7z" fill="url(#spin-gold)" stroke="#9a6a00" strokeWidth="1.2" />
          <path
            d="M20 15C10 19 5.5 28 6.5 35c1 6 7.5 9 17.5 9s16.5-3 17.5-9c1-7-3.5-16-13.5-20z"
            fill="url(#spin-gold)"
            stroke="#9a6a00"
            strokeWidth="1.5"
          />
          <rect x="16.5" y="12" width="15" height="4.5" rx="2" fill="#14532d" stroke="#0b3d22" strokeWidth="0.8" />
          <text x="24" y="35" textAnchor="middle" fontSize="10" fontWeight="900" fill="#8a5a00">
            ETB
          </text>
          <ellipse cx="14" cy="26" rx="3" ry="6" fill="#fff" opacity="0.4" transform="rotate(25 14 26)" />
        </symbol>

        <symbol id="spin-ico-gem" viewBox="0 0 48 48">
          <path d="M10 18l7-9h14l7 9-14 23z" fill="url(#spin-gem)" stroke="#06603f" strokeWidth="1.3" strokeLinejoin="round" />
          <path
            d="M10 18h28M17 9l7 9 7-9M17.5 18L24 41l6.5-23"
            fill="none"
            stroke="#eafff6"
            strokeOpacity="0.6"
            strokeWidth="1"
          />
          <path d="M17 9l-3.5 9h7z" fill="#fff" opacity="0.35" />
        </symbol>

        <symbol id="spin-ico-crown" viewBox="0 0 48 48">
          <path
            d="M7 35L5 14l11 9 8-15 8 15 11-9-2 21z"
            fill="url(#spin-gold)"
            stroke="#9a6a00"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <rect x="7" y="34" width="34" height="7" rx="2" fill="url(#spin-gold)" stroke="#9a6a00" strokeWidth="1.2" />
          <circle cx="24" cy="26" r="3.4" fill="#e11d48" stroke="#7f0d27" strokeWidth="0.8" />
          <circle cx="14.5" cy="28" r="2.2" fill="#22c55e" stroke="#0b5d2b" strokeWidth="0.6" />
          <circle cx="33.5" cy="28" r="2.2" fill="#22c55e" stroke="#0b5d2b" strokeWidth="0.6" />
          <circle cx="5" cy="14" r="2.4" fill="url(#spin-gold)" />
          <circle cx="24" cy="8" r="2.4" fill="url(#spin-gold)" />
          <circle cx="43" cy="14" r="2.4" fill="url(#spin-gold)" />
        </symbol>

        <symbol id="spin-ico-ball" viewBox="0 0 48 48">
          <circle cx="24" cy="25.5" r="18" fill="#000" opacity="0.25" />
          <circle cx="24" cy="24" r="18" fill="url(#spin-ball)" stroke="#a3a3a3" strokeWidth="1" />
          <circle cx="24" cy="24" r="10" fill="#e11d48" />
          <text x="24" y="28.5" textAnchor="middle" fontSize="12" fontWeight="900" fill="#fff">
            K
          </text>
          <ellipse cx="17" cy="14" rx="5" ry="2.4" fill="#fff" opacity="0.9" transform="rotate(-30 17 14)" />
        </symbol>
      </defs>
    </svg>
  );
}

/** A prize picture outside the wheel (win card, odds table). */
export function PrizeIcon({ icon, size = 40, className }: { icon: SpinIcon; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden>
      <use href={`#spin-ico-${icon}`} />
    </svg>
  );
}
