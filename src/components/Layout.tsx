import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletApi';
import SportsSidebar from './SportsSidebar';
import BetslipContent from './BetslipContent';
import BottomNav from './BottomNav';
import DesktopSubNav from './DesktopSubNav';
import AppFooter from './AppFooter';

function isHomeRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/sport-new';
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, hydrate } = useSessionStore();
  const loggedIn = !!(username && username.length > 0);
  const showHeaderBack = !isHomeRoute(location.pathname);

  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(useSessionStore.getState().getAuthHeader()),
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const balanceCurrency = walletQ.data?.currency ?? 'ETB';
  const balanceLabel =
    walletQ.isPending && loggedIn
      ? `… ${balanceCurrency}`
      : walletQ.isError || walletQ.data?.status === 'error'
        ? `— ${balanceCurrency}`
        : walletQ.data?.balance != null && Number.isFinite(walletQ.data.balance)
          ? `${Number(walletQ.data.balance).toFixed(2)} ${balanceCurrency}`
          : `— ${balanceCurrency}`;

  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const id = window.setTimeout(() => searchInputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen]);

  return (
    <div className={`app-shell b365 ${isHomeRoute(location.pathname) ? 'b365-home-shell' : ''}`}>
      <header className="b365-header">
        <div className="b365-header-inner">
          <div className="b365-header-start">
            {showHeaderBack && (
              <button
                type="button"
                className="b365-header-back"
                aria-label="Back"
                onClick={() => navigate(-1)}
              >
                ←
              </button>
            )}
            <NavLink to="/" className="b365-brand" end title="Superbet">
              <img src="/sblogo.png" alt="Superbet" className="b365-brand-logo" />
            </NavLink>
          </div>

          <div className="b365-header-actions">
            <div className="b365-header-search-trigger-wrap">
              <button
                type="button"
                className={`b365-header-search-icon-btn ${searchOpen ? 'active' : ''}`}
                aria-label={searchOpen ? 'Close search' : 'Open search'}
                aria-expanded={searchOpen}
                aria-controls="b365-header-search-panel"
                onClick={() => setSearchOpen((open) => !open)}
              >
                <svg className="b365-header-search-icon-btn-svg" viewBox="0 0 24 24" aria-hidden focusable="false">
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l5 5" />
                </svg>
              </button>
            </div>
            {loggedIn ? (
              <>
                <NavLink to="/profile" className="b365-header-pill b365-header-pill--name" title="Account">
                  {username}
                </NavLink>
                <span className="b365-header-pill b365-header-pill--wallet" title="Balance">
                  {balanceLabel}
                </span>
              </>
            ) : (
              <>
                <NavLink to="/profile?tab=signup" className="b365-btn-outline">
                  Join
                </NavLink>
                <NavLink to="/profile" className="b365-btn-header-login">
                  Log In
                </NavLink>
              </>
            )}
          </div>
        </div>

        {searchOpen ? (
          <>
            <div
              className="b365-header-search-backdrop"
              aria-hidden
              onClick={() => setSearchOpen(false)}
            />
            <div id="b365-header-search-panel" className="b365-header-search-panel" role="search">
              <div className="b365-header-search-panel-inner">
                <label className="b365-header-search-field" htmlFor="header-search-input">
                  <span className="b365-header-search-glyph" aria-hidden="true">
                    <svg viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="6.5" />
                      <path d="M16 16l5 5" />
                    </svg>
                  </span>
                  <input
                    ref={searchInputRef}
                    id="header-search-input"
                    type="search"
                    className="b365-header-search-input"
                    placeholder="Search for matches, leagues, or players..."
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  className="b365-header-search-close"
                  aria-label="Close search"
                  onClick={() => setSearchOpen(false)}
                >
                  ×
                </button>
              </div>
            </div>
          </>
        ) : null}
      </header>

      <DesktopSubNav />

      <section
        className={`b365-sports-rail-wrap ${isHomeRoute(location.pathname) ? 'b365-sports-rail-wrap--home' : ''}`}
        aria-label="Sports menu"
      >
        <SportsSidebar />
      </section>

      <div className="b365-body"       style={{ paddingTop: '35px' }}
      >
        <aside className="b365-sidebar-left b365-desktop-sports-sidebar" aria-label="Sports menu">
          <SportsSidebar />
        </aside>

        <main id="main" className="b365-main"       
        >
          <Outlet />
        </main>

        <aside className="b365-sidebar-right b365-betslip-rail" aria-label="Bet slip">
          <div className="b365-betslip-rail-inner">
            <BetslipContent />
          </div>
        </aside>
      </div>

      <AppFooter />

      <BottomNav />
    </div>
  );
}
