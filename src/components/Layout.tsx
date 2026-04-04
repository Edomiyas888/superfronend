import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletStub';
import SportsSidebar from './SportsSidebar';
import BetslipContent from './BetslipContent';
import BottomNav from './BottomNav';
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
    queryFn: () => fetchBalance(),
    enabled: loggedIn,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const balanceLabel =
    walletQ.data?.balance != null && Number.isFinite(walletQ.data.balance)
      ? `${Number(walletQ.data.balance).toFixed(2)} ${walletQ.data.currency}`
      : `0.00 ${walletQ.data?.currency ?? 'ETB'}`;

  return (
    <div className="app-shell b365">
      <div className="b365-topbar">
        <div className="b365-topbar-inner">
          <span className="b365-topbar-links">
            <a href="#main">Help</a>
            <a href="#main">Rules</a>
            <a href="#main">Responsible Gambling</a>
          </span>
          <span className="b365-topbar-meta">18+ · Superbet demo UI</span>
        </div>
      </div>

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
      </header>

      <div className="b365-body">
        <aside className="b365-sidebar-left" aria-label="Sports menu">
          <SportsSidebar />
        </aside>

        <main id="main" className="b365-main">
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
