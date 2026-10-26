import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import TelebirrDepositFlow from '../features/wallet/TelebirrDepositFlow';
import FreeBetCard from '../features/freeBet/FreeBetCard';
import HappyHourCard from '../features/promo/HappyHourCard';
import SpinPromoCard from '../features/spin/SpinPromoCard';
import BonusBalanceCard from '../features/wallet/BonusBalanceCard';
import KenoFreeTicketsCard from '../features/wallet/KenoFreeTicketsCard';
import WalletBalanceCard from '../features/wallet/WalletBalanceCard';
import WithdrawPanel from '../features/wallet/WithdrawPanel';
import TransactionHistory from '../features/wallet/TransactionHistory';
import { DepositIcon, HistoryIcon, LockIcon, WithdrawIcon } from '../features/wallet/WalletIcons';
import TelegramGlyph from '../components/TelegramGlyph';
import { fetchBalance } from '../features/wallet/walletApi';

type WalletTab = 'deposit' | 'withdraw' | 'history';

const TABS: { id: WalletTab; label: string; icon: JSX.Element }[] = [
  { id: 'deposit', label: 'Deposit', icon: <DepositIcon size={17} /> },
  { id: 'withdraw', label: 'Withdraw', icon: <WithdrawIcon size={17} /> },
  { id: 'history', label: 'History', icon: <HistoryIcon size={17} /> },
];

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: WalletTab =
    tabParam === 'withdraw' || tabParam === 'history' ? tabParam : 'deposit';

  const { token, username, phone, getAuthHeader, isTelegramApp } = useSessionStore();
  // Stable per token so child effects keyed on headers don't refire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const authHeaders = useMemo(() => getAuthHeader(), [token]);
  const queryClient = useQueryClient();
  const loggedIn = !!username;

  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(authHeaders),
    enabled: loggedIn,
    staleTime: 30_000,
  });

  const currency = walletQ.data?.currency ?? 'ETB';
  const balanceOk = !walletQ.isPending && !walletQ.isError && walletQ.data?.status !== 'error';
  const promo = balanceOk ? (walletQ.data?.promo ?? null) : null;
  const promoBalance = promo?.balance ?? 0;
  const balance = balanceOk ? Number(walletQ.data?.balance ?? 0) + promoBalance : null;
  const withdrawable = balanceOk
    ? Number(walletQ.data?.withdrawable ?? walletQ.data?.balance ?? 0)
    : null;
  const nonWithdrawable = balanceOk ? Number(walletQ.data?.nonWithdrawable ?? 0) : null;
  const bonusBalance = walletQ.data?.status === 'live' ? Number(walletQ.data.bonusBalance ?? 0) : 0;

  const setTab = (next: WalletTab) => {
    setSearchParams(next === 'deposit' ? {} : { tab: next }, { replace: true });
  };

  const invalidateWallet = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet', 'header'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet', 'transactions'] }),
      queryClient.invalidateQueries({ queryKey: ['promo', 'spins'] }),
    ]);
  };

  if (!loggedIn) {
    return (
      <div className="b365-wallet">
        <h1 className="b365-page-title">Wallet</h1>
        <div className="b365-wallet-guest">
          <span className="b365-wallet-guest__icon">
            <LockIcon size={24} />
          </span>
          <p className="b365-wallet-guest__title">Sign in to use your wallet</p>
          <p>Deposit with Telebirr, withdraw your winnings and track every transaction.</p>
          <Link to="/profile" className="b365-wallet-btn b365-wallet-btn--primary b365-wallet-btn--block">
            Log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="b365-wallet">
      <h1 className="b365-page-title">Wallet</h1>

      <WalletBalanceCard
        currency={currency}
        balance={balance}
        withdrawable={withdrawable}
        nonWithdrawable={nonWithdrawable}
        bonusBalance={bonusBalance}
        promoBalance={promoBalance}
        loading={walletQ.isPending}
        error={walletQ.isError || walletQ.data?.status === 'error'}
        refreshing={walletQ.isFetching && !walletQ.isPending}
        onRefresh={() => void invalidateWallet()}
      />

      <BonusBalanceCard promo={promo} currency={currency} />
      <KenoFreeTicketsCard tickets={balanceOk ? walletQ.data?.kenoFreeTickets : null} />
      <HappyHourCard onDeposit={() => setTab('deposit')} />
      <SpinPromoCard onDeposit={() => setTab('deposit')} />
      <FreeBetCard freeBet={walletQ.data?.freeBet} currency={currency} onDeposit={() => setTab('deposit')} />

      <div className="b365-wallet-tabs" role="tablist" aria-label="Wallet">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`wallet-tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls="wallet-panel"
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <section
        key={tab}
        id="wallet-panel"
        role="tabpanel"
        aria-labelledby={`wallet-tab-${tab}`}
        className="b365-wallet-panel"
      >
        {tab === 'deposit' ? (
          isTelegramApp ? (
            <TelebirrDepositFlow
              authHeaders={authHeaders}
              currency={currency}
              onSuccess={() => {
                void invalidateWallet();
              }}
            />
          ) : (
            <div className="b365-wallet-notice">
              <span className="b365-wallet-notice__icon b365-wallet-notice__icon--tg">
                <TelegramGlyph size={18} />
              </span>
              <div>
                <p className="b365-wallet-notice__title">Deposit in Telegram</p>
                <p>
                  Deposits are only available in the Super Bet Telegram Mini App. Open the bot in Telegram and
                  launch Super Bet from there to deposit.
                </p>
              </div>
            </div>
          )
        ) : null}

        {tab === 'withdraw' ? (
          <WithdrawPanel
            authHeaders={authHeaders}
            currency={currency}
            withdrawable={withdrawable}
            nonWithdrawable={nonWithdrawable}
            freeBet={walletQ.data?.freeBet}
            defaultPhone={phone}
            onDeposit={() => setTab('deposit')}
            onSuccess={invalidateWallet}
          />
        ) : null}

        {tab === 'history' ? (
          <TransactionHistory
            authHeaders={authHeaders}
            currency={currency}
            enabled={loggedIn}
            onDeposit={() => setTab('deposit')}
          />
        ) : null}
      </section>
    </div>
  );
}
