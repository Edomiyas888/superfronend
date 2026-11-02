import { Fragment } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import fastKenoLogo from '../assets/fast-keno-logo-user.png';
import BingoBallIcon from './BingoBallIcon';
import { useSpinStatus } from '../features/spin/spinApi';
import { spinsLabel } from '../features/spin/spinRules';

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
    to: '/bingo',
    label: 'Bingo',
    className: 'b365-bottom-nav-item--bingo',
    icon: <BingoBallIcon className="b365-bottom-nav-bingo-ball" />,
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

const SPIN_SLICES = ['#facc15', '#e11d48', '#22c55e', '#7c3aed', '#f97316', '#0ea5e9', '#facc15', '#e11d48'];

function slicePath(i: number) {
  const step = (Math.PI * 2) / SPIN_SLICES.length;
  const point = (a: number) => `${(40 * Math.sin(a)).toFixed(2)} ${(-40 * Math.cos(a)).toFixed(2)}`;
  return `M0 0 L${point(i * step)} A40 40 0 0 1 ${point((i + 1) * step)} Z`;
}

/** The raised centre button: a little prize wheel that spins, settles and spins again. */
function SpinNavItem() {
  const { data } = useSpinStatus();
  const ready = data?.player?.available ?? 0;
  return (
    <NavLink
      to="/spin"
      className={({ isActive }) => `b365-bottom-nav-item b365-bottom-nav-item--spin${isActive ? ' active' : ''}`}
      aria-label={ready > 0 ? `Spin & Win, ${spinsLabel(ready)} ready` : 'Spin & Win'}
    >
      <span className="b365-nav-spin">
        <svg className="b365-nav-spin__wheel" viewBox="-50 -50 100 100" aria-hidden="true">
          <circle r="49" fill="#b8860b" />
          <circle r="46" fill="#fde68a" />
          <circle r="42" fill="#1c1404" />
          <g className="b365-nav-spin__disc">
            {SPIN_SLICES.map((color, i) => (
              <path key={i} d={slicePath(i)} fill={color} stroke="#1c1404" strokeWidth="1.2" />
            ))}
            {SPIN_SLICES.map((_, i) => (
              <circle key={i} r="2.2" fill="#fff7d1" transform={`rotate(${i * 45}) translate(0 -44)`} />
            ))}
          </g>
          <circle r="11" fill="#facc15" stroke="#7a4d00" strokeWidth="2" />
          <circle r="4.5" fill="#7a4d00" />
        </svg>
        <svg className="b365-nav-spin__pointer" viewBox="0 0 20 24" aria-hidden="true">
          <path d="M10 23 L2.5 7 A8 8 0 1 1 17.5 7 Z" fill="#e11d48" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {ready > 0 ? <span className="b365-nav-spin__badge">{ready}</span> : null}
      </span>
      <span className="b365-bottom-nav-label">Spin</span>
    </NavLink>
  );
}

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
        {navItems.map((item, i) => (
          <Fragment key={item.to}>
            {/* Spin & Win sits in the middle, raised above the bar. */}
            {i === Math.floor(navItems.length / 2) ? <SpinNavItem /> : null}
            <NavItem item={item} sportsActive={sportsActive} kenoActive={kenoActive} pathname={pathname} />
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
