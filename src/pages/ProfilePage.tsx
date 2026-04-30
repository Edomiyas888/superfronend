import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '../features/auth/sessionStore';
import { depositWallet, fetchBalance, withdrawWallet } from '../features/wallet/walletApi';

type Tab = 'login' | 'signup';

function friendlyAuthError(err: unknown, fallback: string): string {
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return `${fallback} Check that the API is running and CORS allows this site’s URL (no trailing slash).`;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') === 'signup' ? 'signup' : 'login') as Tab;

  const { username, phone, hydrate, clearSession, register, login, getAuthHeader } = useSessionStore();
  const queryClient = useQueryClient();
  const [suUser, setSuUser] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suPass2, setSuPass2] = useState('');
  const [liUser, setLiUser] = useState('');
  const [liPass, setLiPass] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAmount, setWalletAmount] = useState('');
  const [walletBusy, setWalletBusy] = useState<'deposit' | 'withdraw' | null>(null);
  const [walletErr, setWalletErr] = useState<string | null>(null);

  const loggedIn = !!(username && username.length > 0);
  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(getAuthHeader()),
    enabled: loggedIn,
    staleTime: 30_000,
  });

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const setTab = (t: Tab) => {
    setSearchParams(t === 'login' ? {} : { tab: 'signup' });
    setMessage(null);
    setError(null);
  };

  const onSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (suPass !== suPass2) {
      setError('Passwords do not match.');
      return;
    }
    if (suPass.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      await register(suUser, suPhone, suPass);
      setMessage('Account created. You are signed in.');
      setSuPass('');
      setSuPass2('');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign up.'));
    }
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await login(liUser, liPass);
      setMessage('Signed in successfully.');
      setLiPass('');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign in.'));
    }
  };

  const parseWalletAmount = (): number | null => {
    const n = Number.parseFloat(walletAmount.replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100) / 100;
  };

  const onDeposit = async () => {
    setWalletErr(null);
    const amt = parseWalletAmount();
    if (amt == null) {
      setWalletErr('Enter a positive amount.');
      return;
    }
    setWalletBusy('deposit');
    try {
      await depositWallet(getAuthHeader(), amt);
      setWalletAmount('');
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'header'] });
    } catch (err) {
      setWalletErr(err instanceof Error ? err.message : 'Deposit failed.');
    } finally {
      setWalletBusy(null);
    }
  };

  const onWithdraw = async () => {
    setWalletErr(null);
    const amt = parseWalletAmount();
    if (amt == null) {
      setWalletErr('Enter a positive amount.');
      return;
    }
    setWalletBusy('withdraw');
    try {
      await withdrawWallet(getAuthHeader(), amt);
      setWalletAmount('');
      await queryClient.invalidateQueries({ queryKey: ['wallet', 'header'] });
    } catch (err) {
      setWalletErr(err instanceof Error ? err.message : 'Withdraw failed.');
    } finally {
      setWalletBusy(null);
    }
  };

  return (
    <div>
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Profile</span>
      </div>

      <h1 className="b365-page-title">Profile</h1>

      {loggedIn ? (
        <>
          <div className="card b365-card b365-profile-card">
          <h2 className="b365-profile-heading">Account</h2>
          <dl className="b365-profile-dl">
            <div>
              <dt>Username</dt>
              <dd>{username}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{phone || '—'}</dd>
            </div>
          </dl>
          <p className="b365-muted b365-profile-note">
            Signed in with your server account. A JWT is stored in this browser for session and betting requests.
          </p>
          <button
            type="button"
            className="b365-btn-secondary"
            onClick={() => {
              clearSession();
              setMessage('Signed out.');
            }}
          >
            Sign out
          </button>
          {message && <p className="b365-success">{message}</p>}
        </div>

        <div className="card b365-card b365-profile-card">
          <h2 className="b365-profile-heading">Wallet</h2>
          <p className="b365-profile-balance">
            {walletQ.isPending
              ? '…'
              : walletQ.isError || walletQ.data?.status === 'error'
                ? '—'
                : Number(walletQ.data?.balance ?? 0).toFixed(2)}{' '}
            <span className="b365-muted">{walletQ.data?.currency ?? 'ETB'}</span>
          </p>
          <label className="b365-field-label">
            Amount
            <input
              type="number"
              className="b365-input"
              min={0}
              step={0.01}
              value={walletAmount}
              onChange={(e) => setWalletAmount(e.target.value)}
              disabled={walletBusy !== null}
            />
          </label>
          <div className="b365-wallet-actions">
            <button
              type="button"
              className="b365-btn-primary"
              disabled={walletBusy !== null}
              onClick={() => void onDeposit()}
            >
              {walletBusy === 'deposit' ? 'Depositing…' : 'Deposit'}
            </button>
            <button
              type="button"
              className="b365-btn-secondary"
              disabled={walletBusy !== null}
              onClick={() => void onWithdraw()}
            >
              {walletBusy === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
            </button>
          </div>
          {walletErr && <p className="b365-error">{walletErr}</p>}
        </div>
        </>
      ) : (
        <>
          <div className="b365-profile-tabs">
            <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => setTab('login')}>
              Log in
            </button>
            <button type="button" className={tab === 'signup' ? 'active' : ''} onClick={() => setTab('signup')}>
              Sign up
            </button>
          </div>

          {tab === 'login' && (
            <form className="card b365-card b365-auth-form" onSubmit={onLogin} autoComplete="on">
              <h2 className="b365-profile-heading">Log in</h2>
              <label className="b365-field-label">
                Username
                <input
                  name="username"
                  className="b365-input"
                  value={liUser}
                  onChange={(e) => setLiUser(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="b365-field-label">
                Password
                <input
                  name="password"
                  type="password"
                  className="b365-input"
                  value={liPass}
                  onChange={(e) => setLiPass(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
              {error && <p className="b365-error">{error}</p>}
              {message && <p className="b365-success">{message}</p>}
              <button type="submit" className="b365-btn-primary b365-btn-block">
                Log in
              </button>
            </form>
          )}

          {tab === 'signup' && (
            <form className="card b365-card b365-auth-form" onSubmit={onSignup} autoComplete="on">
              <h2 className="b365-profile-heading">Create account</h2>
              <label className="b365-field-label">
                Username
                <input
                  name="username"
                  className="b365-input"
                  value={suUser}
                  onChange={(e) => setSuUser(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="b365-field-label">
                Phone
                <input
                  name="phone"
                  className="b365-input"
                  value={suPhone}
                  onChange={(e) => setSuPhone(e.target.value)}
                  autoComplete="tel"
                />
              </label>
              <label className="b365-field-label">
                Password
                <input
                  name="password"
                  type="password"
                  className="b365-input"
                  value={suPass}
                  onChange={(e) => setSuPass(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </label>
              <label className="b365-field-label">
                Confirm password
                <input
                  name="password2"
                  type="password"
                  className="b365-input"
                  value={suPass2}
                  onChange={(e) => setSuPass2(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </label>
              {error && <p className="b365-error">{error}</p>}
              {message && <p className="b365-success">{message}</p>}
              <button type="submit" className="b365-btn-primary b365-btn-block">
                Sign up
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
