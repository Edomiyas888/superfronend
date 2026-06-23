import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletApi';
import SportsSidebar from './SportsSidebar';
import BetslipContent from './BetslipContent';
import BetslipDrawer from './BetslipDrawer';
import BetslipFab from './BetslipFab';
import NavDrawer from './NavDrawer';
import BottomNav from './BottomNav';
import AppFooter from './AppFooter';
import { useBetslipOddsSync } from '../hooks/useBetslipOddsSync';
import { useNavDrawerStore } from '../features/nav/navDrawerStore';

function isHomeRoute(pathname: string): boolean {
  return pathname === '/' || pathname === '/sport-new';
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { username, hydrate } = useSessionStore();
  const loggedIn = !!(username && username.length > 0);
  const showHeaderBack = !isHomeRoute(location.pathname);
  const openNavDrawer = useNavDrawerStore((s) => s.open);

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

  useBetslipOddsSync();

  useEffect(() => {
    const onWallet = () => {
      void walletQ.refetch();
    };
    window.addEventListener('superbet:wallet-changed', onWallet);
    return () => window.removeEventListener('superbet:wallet-changed', onWallet);
  }, [walletQ]);

  const balanceCurrency = walletQ.data?.currency ?? 'ETB';
  const balanceLabel =
    walletQ.isPending && loggedIn
      ? `… ${balanceCurrency}`
      : walletQ.isError || walletQ.data?.status === 'error'
        ? `— ${balanceCurrency}`
        : walletQ.data?.balance != null && Number.isFinite(walletQ.data.balance)
          ? `${Number(walletQ.data.balance).toFixed(2)} ${balanceCurrency}`
          : `— ${balanceCurrency}`;

  return (
    <div className="app-shell b365">
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
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M12.5 15L7.5 10L12.5 5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
            <NavLink to="/" className="b365-brand" end title="S Bet">
              <img src="/sblogo.png" alt="S Bet" className="b365-brand-logo" />
            </NavLink>
          </div>

          <div className="b365-header-actions">
            {loggedIn ? (
              <>
                <Link to="/wallet" className="b365-header-balance" title="Wallet">
                  {balanceLabel}
                </Link>
                <Link to="/wallet?tab=deposit" className="b365-header-deposit-btn">
                  Deposit
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/profile?tab=signup" className="b365-btn-outline b365-header-auth-btn">
                  Join
                </NavLink>
                <NavLink to="/profile" className="b365-btn-header-login b365-header-auth-btn">
                  Log In
                </NavLink>
              </>
            )}

            <button
              type="button"
              className="b365-header-icon-btn"
              aria-label="Open menu"
              onClick={openNavDrawer}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              </svg>
            </button>
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

      <BetslipFab />

      <BetslipDrawer />

      <NavDrawer balanceLabel={balanceLabel} loggedIn={loggedIn} />
    </div>
  );
}
