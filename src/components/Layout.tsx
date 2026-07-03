import { NavLink, Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import appLogo from '../assets/app-logo.png';
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
  const { username, hydrate, isTelegramApp } = useSessionStore();
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
    if (!isTelegramApp) {
      void hydrate();
    }
  }, [hydrate, isTelegramApp]);

  useBetslipOddsSync();

  useEffect(() => {
    const onWallet = () => {
      void walletQ.refetch();
    };
    window.addEventListener('superbet:wallet-changed', onWallet);
    return () => window.removeEventListener('superbet:wallet-changed', onWallet);
  }, [walletQ]);

  const balanceCurrency = walletQ.data?.currency ?? 'ETB';
  const walletLoading = walletQ.isPending && loggedIn;
  const walletError = walletQ.isError || walletQ.data?.status === 'error';
  const walletBalance =
    walletLoading || walletError || walletQ.data?.status === 'error'
      ? null
      : Number(walletQ.data?.balance ?? 0);
  const walletWithdrawable =
    walletLoading || walletError || walletQ.data?.status === 'error'
      ? null
      : Number(walletQ.data?.withdrawable ?? walletQ.data?.balance ?? 0);
  const walletNonWithdrawable =
    walletLoading || walletError || walletQ.data?.status === 'error'
      ? null
      : Number(walletQ.data?.nonWithdrawable ?? 0);
  const balanceLabel =
    walletLoading
      ? `… ${balanceCurrency}`
      : walletError
        ? `— ${balanceCurrency}`
        : walletBalance != null && Number.isFinite(walletBalance)
          ? `${walletBalance.toFixed(2)} ${balanceCurrency}`
          : `— ${balanceCurrency}`;

  return (
    <div className={`app-shell b365${isTelegramApp ? ' tma' : ''}`}>
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
              <img src={appLogo} alt="S Bet" className="b365-brand-logo" />
            </NavLink>
          </div>

          <div className="b365-header-actions">
            {loggedIn ? (
              <div className="b365-header-wallet">
                <Link to="/wallet" className="b365-header-balance" title="Wallet">
                  <span className="b365-header-balance__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 8.5A2.5 2.5 0 016.5 6H18a2 2 0 012 2v1.2M4 8.5V16a2 2 0 002 2h12a2 2 0 002-2v-1.2M4 8.5h16"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="17" cy="13" r="1.25" fill="currentColor" />
                    </svg>
                  </span>
                  <span className="b365-header-balance__text">{balanceLabel}</span>
                </Link>
                <Link to="/wallet?tab=deposit" className="b365-header-deposit-btn">
                  Deposit
                </Link>
              </div>
            ) : isTelegramApp ? null : (
              <div className="b365-header-auth">
                <NavLink to="/profile?tab=signup" className="b365-btn-outline b365-header-auth-btn">
                  Join
                </NavLink>
                <NavLink to="/profile" className="b365-btn-header-login b365-header-auth-btn">
                  Log In
                </NavLink>
              </div>
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

      <NavDrawer
        loggedIn={loggedIn}
        balance={walletBalance}
        withdrawable={walletWithdrawable}
        nonWithdrawable={walletNonWithdrawable}
        currency={balanceCurrency}
        loading={walletLoading}
      />
    </div>
  );
}
