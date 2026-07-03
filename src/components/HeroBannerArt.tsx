import WorldCupTrophyIcon from './WorldCupTrophyIcon';

function HeroBannerArt({
  variant = 'default',
  imageSrc,
}: {
  variant?: 'default' | 'keno' | 'wc';
  imageSrc?: string;
}) {
  if (imageSrc) {
    return (
      <>
        <div className="b365-hero-banner__bg" aria-hidden="true">
          <img
            src={imageSrc}
            alt=""
            className="b365-hero-banner__bg-img"
            draggable={false}
            decoding="async"
          />
        </div>
        <div className="b365-hero-banner__overlay" aria-hidden="true" />
      </>
    );
  }

  if (variant === 'wc') {
    return (
      <div className="b365-hero-banner__art b365-hero-banner__art--wc" aria-hidden="true">
        <span className="b365-hero-banner__art-glow" />
        <WorldCupTrophyIcon className="b365-hero-banner__wc-trophy" animated />
      </div>
    );
  }

  const glow =
    variant === 'keno' ? 'rgba(57, 255, 20, 0.35)' : 'rgba(255, 193, 7, 0.38)';

  return (
    <div className="b365-hero-banner__art" aria-hidden="true">
      <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="heroGlow" cx="70%" cy="55%" r="55%">
            <stop offset="0%" stopColor={glow} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE566" />
            <stop offset="55%" stopColor="#FFC107" />
            <stop offset="100%" stopColor="#E6A800" />
          </linearGradient>
          <linearGradient id="heroGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7CFF6B" />
            <stop offset="100%" stopColor="#39FF14" />
          </linearGradient>
        </defs>
        <ellipse cx="108" cy="62" rx="58" ry="48" fill="url(#heroGlow)" />
        {variant === 'keno' ? (
          <>
            <circle cx="108" cy="58" r="24" fill="url(#heroGreen)" opacity="0.9" />
            <circle cx="98" cy="50" r="5" fill="#0a140e" />
            <circle cx="118" cy="50" r="5" fill="#0a140e" />
            <circle cx="108" cy="66" r="5" fill="#0a140e" />
            <circle cx="98" cy="66" r="5" fill="#0a140e" />
            <circle cx="118" cy="66" r="5" fill="#0a140e" />
            <rect x="88" y="82" width="40" height="10" rx="5" fill="url(#heroGold)" />
          </>
        ) : (
          <>
            <circle cx="112" cy="72" r="16" fill="url(#heroGold)" />
            <path
              d="M96 72c16-10 32-10 48 0"
              stroke="#fff"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.35"
            />
            <path
              d="M88 86h48l-4 12H92l-4-12z"
              fill="url(#heroGold)"
            />
            <path
              d="M96 86V70c0-7 6-13 13-13h6c7 0 13 6 13 13v16"
              stroke="url(#heroGold)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <rect x="126" y="54" width="18" height="24" rx="3" fill="url(#heroGold)" transform="rotate(18 135 66)" />
            <rect x="132" y="58" width="18" height="24" rx="3" fill="#fff" opacity="0.85" transform="rotate(18 141 70)" />
          </>
        )}
      </svg>
    </div>
  );
}

function FooterIcon({ type }: { type: 'live' | 'wallet' | 'payout' | 'odds' | 'groups' | 'keno' | 'numbers' | 'draws' | 'etb' | 'games' | 'risk' | 'fun' }) {
  const common = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const };
  switch (type) {
    case 'live':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.75" />
          <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common}>
          <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
          <path d="M3 10h18M16 14h2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'payout':
      return (
        <svg {...common}>
          <path d="M12 3v18M7 8l5-5 5 5M7 16l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'odds':
      return (
        <svg {...common}>
          <path d="M4 18l6-8 4 5 6-10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'groups':
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="16" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.75" />
          <path d="M4 19c0-3 2.5-5 5-5s5 2 5 5M14 19c0-2 1.5-3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'keno':
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.75" />
          <circle cx="9" cy="10" r="1.5" fill="currentColor" />
          <circle cx="15" cy="10" r="1.5" fill="currentColor" />
          <circle cx="12" cy="15" r="1.5" fill="currentColor" />
        </svg>
      );
    case 'numbers':
      return (
        <svg {...common}>
          <path d="M7 6h10M7 12h10M7 18h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      );
    case 'draws':
      return (
        <svg {...common}>
          <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'etb':
      return (
        <svg {...common}>
          <path d="M12 4v16M8 8c2-2 8-2 8 0s-6 2-8 4 8 2 8 4-6 2-8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'games':
      return (
        <svg {...common}>
          <path d="M8 12h2v2H8v-2zM14 10h2v2h-2v-2zM6 8h12a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case 'risk':
      return (
        <svg {...common}>
          <path d="M12 4v16M8 8c2-2 8-2 8 0s-6 2-8 4 8 2 8 4-6 2-8 0" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'fun':
      return (
        <svg {...common}>
          <path d="M9 8h.01M15 8h.01M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      );
    default:
      return null;
  }
}

export { HeroBannerArt, FooterIcon };
