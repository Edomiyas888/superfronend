import { useEffect, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useNavDrawerStore } from '../features/nav/navDrawerStore';
import { useSessionStore } from '../features/auth/sessionStore';
import WalletBalanceSummary from './WalletBalanceSummary';

type NavItem = {
  to: string;
  end?: boolean;
  label: string;
  icon: ReactNode;
  match?: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    end: true,
    label: 'Home',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/keno',
    label: 'Fast Keno',
    match: (p) => p === '/keno' || p.startsWith('/keno/'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <circle cx="8" cy="10" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="12" cy="8" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="16" cy="11" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="10" cy="15" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="15" cy="16" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    to: '/sports',
    label: 'Sports',
    match: (p) => p === '/sports' || p.startsWith('/sport/'),
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/live',
    label: 'In-Play',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M2 12a10 10 0 0 1 10-10" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
        <path d="M12 6v2M12 16v2M6 12h2M16 12h2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/my-bets',
    label: 'My Bets',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" />
        <path d="M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/wallet',
    label: 'Wallet',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 7h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 7V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2M16 13h.01" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Profile',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
        <circle cx="12" cy="8" r="4" />
      </svg>
    ),
  },
];

type Props = {
  loggedIn: boolean;
  balance: number | null;
  withdrawable: number | null;
  nonWithdrawable: number | null;
  currency: string;
  loading?: boolean;
};

export default function NavDrawer({
  loggedIn,
  balance,
  withdrawable,
  nonWithdrawable,
  currency,
  loading = false,
}: Props) {
  const isOpen = useNavDrawerStore((s) => s.isOpen);
  const close = useNavDrawerStore((s) => s.close);
  const username = useSessionStore((s) => s.username);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { pathname } = useLocation();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  if (!isOpen) return null;

  return (
    <>
      <div className="b365-drawer-backdrop" role="presentation" onClick={close} />
      <aside className="b365-drawer-panel b365-nav-drawer" aria-label="Menu">
        <div className="b365-drawer-head">
          <h2 className="b365-drawer-title">Menu</h2>
          <button type="button" className="b365-drawer-close" onClick={close} aria-label="Close menu">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="b365-drawer-body">
          {loggedIn ? (
            <div className="b365-nav-drawer-user">
              <div className="b365-nav-drawer-avatar" aria-hidden="true">
                {(username ?? '?').charAt(0).toUpperCase()}
              </div>
              <div className="b365-nav-drawer-user-meta">
                <span className="b365-nav-drawer-user-name">{username}</span>
              </div>
            </div>
          ) : (
            <div className="b365-nav-drawer-auth">
              <NavLink to="/profile?tab=signup" className="b365-btn-outline b365-nav-drawer-auth-btn" onClick={close}>
                Join
              </NavLink>
              <NavLink to="/profile" className="b365-btn-header-login b365-nav-drawer-auth-btn" onClick={close}>
                Log In
              </NavLink>
            </div>
          )}

          {loggedIn ? (
            <WalletBalanceSummary
              variant="drawer"
              balance={balance}
              withdrawable={withdrawable}
              nonWithdrawable={nonWithdrawable}
              currency={currency}
              loading={loading}
            />
          ) : null}

          <nav className="b365-nav-drawer-links" aria-label="App sections">
            {NAV_ITEMS.map((item) => {
              const active = item.match ? item.match(pathname) : item.end ? pathname === item.to : pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={`b365-nav-drawer-link${active ? ' active' : ''}`}
                  onClick={close}
                >
                  <span className="b365-nav-drawer-link-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {loggedIn && (
            <button
              type="button"
              className="b365-nav-drawer-logout"
              onClick={() => {
                clearSession();
                close();
              }}
            >
              Log out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
