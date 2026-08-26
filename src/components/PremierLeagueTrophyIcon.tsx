type Props = {
  className?: string;
  animated?: boolean;
};

/** Inline trophy mark for the Premier League CTAs — no remote asset, scales with `height`. */
export default function PremierLeagueTrophyIcon({ className = '', animated = true }: Props) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="presentation"
      aria-hidden="true"
      focusable="false"
      className={['b365-epl-trophy-icon', animated ? 'b365-epl-trophy-icon--safari' : '', className]
        .filter(Boolean)
        .join(' ')}
    >
      <defs>
        <linearGradient id="eplTrophyGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE79A" />
          <stop offset="45%" stopColor="#FFC107" />
          <stop offset="100%" stopColor="#C98A00" />
        </linearGradient>
      </defs>
      <path
        d="M14 8h20v10a10 10 0 0 1-20 0V8z"
        fill="url(#eplTrophyGold)"
        stroke="#8A5D00"
        strokeWidth="1.1"
      />
      <path
        d="M14 11H9.5a2 2 0 0 0-2 2v2a7 7 0 0 0 7 7"
        fill="none"
        stroke="url(#eplTrophyGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M34 11h4.5a2 2 0 0 1 2 2v2a7 7 0 0 1-7 7"
        fill="none"
        stroke="url(#eplTrophyGold)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M21 28h6v6h-6z" fill="url(#eplTrophyGold)" />
      <path
        d="M13 40h22l-1.6-5.2a2 2 0 0 0-1.9-1.4H16.5a2 2 0 0 0-1.9 1.4L13 40z"
        fill="url(#eplTrophyGold)"
        stroke="#8A5D00"
        strokeWidth="1.1"
      />
      <path d="M18 13.5l6 4 6-4" fill="none" stroke="#fff" strokeWidth="1.6" opacity="0.45" />
    </svg>
  );
}
