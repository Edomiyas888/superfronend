type Props = {
  className?: string;
};

/** Inline Super Bingo ball for the home quick links — no remote asset, scales with `height`. */
export default function BingoBallIcon({ className = '' }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={['b365-bingo-ball-icon', className].filter(Boolean).join(' ')}
    >
      <defs>
        <radialGradient id="bingoBallShell" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#F4FFC2" />
          <stop offset="45%" stopColor="#C8FF00" />
          <stop offset="100%" stopColor="#4F6E00" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="21" fill="url(#bingoBallShell)" stroke="#2E4200" strokeWidth="1.2" />
      <circle cx="24" cy="24" r="12.5" fill="#FFFFFF" stroke="#2E4200" strokeWidth="1" />
      <text
        x="24"
        y="21.2"
        textAnchor="middle"
        fontSize="6.5"
        fontWeight="900"
        fill="#0A0A0B"
        fontFamily="system-ui, sans-serif"
      >
        BINGO
      </text>
      <text
        x="24"
        y="32"
        textAnchor="middle"
        fontSize="11"
        fontWeight="900"
        fill="#0A0A0B"
        fontFamily="system-ui, sans-serif"
      >
        75
      </text>
      <ellipse cx="16" cy="11" rx="6" ry="3" fill="#FFFFFF" opacity="0.45" transform="rotate(-25 16 11)" />
    </svg>
  );
}
