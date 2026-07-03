import { NavLink, useLocation } from 'react-router-dom';
import fastKenoLogo from '../assets/fast-keno-logo-user.png';

function useSportsNavActive(): boolean {
  const { pathname } = useLocation();
  return pathname === '/sports' || pathname.startsWith('/sport/');
}

function useKenoNavActive(): boolean {
  const { pathname } = useLocation();
  return pathname === '/keno' || pathname.startsWith('/keno/');
}

const navItems = [
  {
    to: '/',
    end: true as const,
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: '/sports',
    label: 'Sports',
    match: 'sports' as const,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.85" />
        <path
          d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <path
          d="M7.5 7.5c2 1.5 7 1.5 9 0M7.5 16.5c2-1.5 7-1.5 9 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: '/live',
    label: 'In-Play',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.85" />
        <circle cx="12" cy="12" r="2.75" fill="currentColor" stroke="none" />
        <path d="M12 7v2.5M12 14.5V17M7 12h2.5M14.5 12H17" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/my-bets',
    label: 'My bets',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
        />
        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.85" />
        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/keno',
    label: 'Keno',
    match: 'keno' as const,
    className: 'b365-bottom-nav-item--keno',
    icon: (
      <img
        src={fastKenoLogo}
        alt=""
        className="b365-bottom-nav-keno-logo"
        draggable={false}
        decoding="async"
      />
    ),
  },
] as const;

function NavItem({
  item,
  sportsActive,
  kenoActive,
  pathname,
}: {
  item: (typeof navItems)[number];
  sportsActive: boolean;
  kenoActive: boolean;
  pathname: string;
}) {
  const resolveActive = (isActive: boolean) => {
    if ('match' in item && item.match === 'sports') return isActive || sportsActive;
    if ('match' in item && item.match === 'keno') return isActive || kenoActive;
    if (item.to === '/' && pathname === '/sport-new') return true;
    return isActive;
  };

  return (
    <NavLink
      to={item.to}
      end={'end' in item ? item.end : false}
      className={({ isActive }) =>
        [
          'b365-bottom-nav-item',
          'className' in item ? item.className : '',
          resolveActive(isActive) ? 'active' : '',
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      <span className="b365-bottom-nav-icon-wrap">
        <span className="b365-bottom-nav-icon">{item.icon}</span>
      </span>
      <span className="b365-bottom-nav-label">{item.label}</span>
    </NavLink>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const sportsActive = useSportsNavActive();
  const kenoActive = useKenoNavActive();

  return (
    <nav className="b365-bottom-nav" aria-label="Main">
      <div className="b365-bottom-nav__inner">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            item={item}
            sportsActive={sportsActive}
            kenoActive={kenoActive}
            pathname={pathname}
          />
        ))}
      </div>
    </nav>
  );
}
