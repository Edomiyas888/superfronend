import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import AuthAlert from '../components/auth/AuthAlert';
import AuthSubmitButton from '../components/auth/AuthSubmitButton';
import PhoneAuthPanel from '../features/auth/PhoneAuthPanel';
import { useSessionStore } from '../features/auth/sessionStore';
import { isFirebaseConfigured } from '../lib/firebase';

type Tab = 'login' | 'signup' | 'phone';

function friendlyAuthError(err: unknown, fallback: string): string {
  if (err instanceof TypeError && /fetch|network/i.test(String(err.message))) {
    return `${fallback} Check that the API is running and CORS allows this site’s URL (no trailing slash).`;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

const TAB_LABELS: Record<Tab, string> = {
  login: 'Log in',
  signup: 'Sign up',
  phone: 'Phone',
};

export default function ProfilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (
    searchParams.get('tab') === 'signup'
      ? 'signup'
      : searchParams.get('tab') === 'phone'
        ? 'phone'
        : 'login'
  ) as Tab;

  const { username, phone, hydrate, clearSession, register, login } = useSessionStore();
  const [suUser, setSuUser] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suPass2, setSuPass2] = useState('');
  const [liUser, setLiUser] = useState('');
  const [liPass, setLiPass] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [hydrating, setHydrating] = useState(true);

  const loggedIn = !!(username && username.length > 0);
  const authBusy = loginLoading || signupLoading;

  useEffect(() => {
    void hydrate().finally(() => setHydrating(false));
  }, [hydrate]);

  const setTab = (t: Tab) => {
    if (authBusy) return;
    const params: Record<string, string> = {};
    if (t === 'signup') params.tab = 'signup';
    if (t === 'phone') params.tab = 'phone';
    setSearchParams(params);
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
    setSignupLoading(true);
    try {
      await register(suUser, suPhone, suPass);
      setMessage('Account created. You are signed in.');
      setSuPass('');
      setSuPass2('');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign up.'));
    } finally {
      setSignupLoading(false);
    }
  };

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoginLoading(true);
    try {
      await login(liUser, liPass);
      setMessage('Signed in successfully.');
      setLiPass('');
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign in.'));
    } finally {
      setLoginLoading(false);
    }
  };

  if (hydrating) {
    return (
      <div className="b365-profile-page">
        <div className="b365-breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden>›</span>
          <span>Profile</span>
        </div>
        <h1 className="b365-page-title">Profile</h1>
        <div className="b365-auth-shell b365-auth-shell--loading">
          <div className="b365-auth-loading-card">
            <span className="b365-spinner b365-spinner--lg" aria-hidden="true" />
            <p>Checking your session…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="b365-profile-page">
      <div className="b365-breadcrumb">
        <Link to="/">Home</Link>
        <span aria-hidden>›</span>
        <span>Profile</span>
      </div>

      <h1 className="b365-page-title">Profile</h1>

      {loggedIn ? (
        <div className="b365-profile-card b365-card">
          <div className="b365-profile-card-header">
            <div className="b365-profile-avatar" aria-hidden="true">
              {username?.charAt(0).toUpperCase() ?? '?'}
            </div>
            <div>
              <h2 className="b365-profile-card-name">{username}</h2>
              <p className="b365-profile-card-sub">Your Super Bet account</p>
            </div>
          </div>

          <dl className="b365-profile-stats">
            <div>
              <dt>Phone</dt>
              <dd>{phone || '—'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd className="b365-profile-status">Active</dd>
            </div>
          </dl>

          <p className="b365-muted b365-profile-note">
            Signed in securely. Your session is stored in this browser for betting and wallet requests.
          </p>

          {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}

          <div className="b365-profile-actions">
            <Link to="/wallet" className="b365-btn-primary b365-btn-block b365-profile-wallet-link">
              Open wallet
            </Link>
            <button
              type="button"
              className="b365-btn-secondary b365-btn-block"
              onClick={() => {
                clearSession();
                setMessage('Signed out.');
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <div className="b365-auth-shell">
          <div className="b365-auth-intro">
            <h2 className="b365-auth-intro-title">
              {tab === 'signup' ? 'Create your account' : tab === 'phone' ? 'Sign in with phone' : 'Welcome back'}
            </h2>
            <p className="b365-auth-intro-text">
              {tab === 'signup'
                ? 'Register to place bets, manage your wallet, and track your slips.'
                : tab === 'phone'
                  ? 'Verify your number with a one-time SMS code.'
                  : 'Log in to access your balance, bets, and deposits.'}
            </p>
          </div>

          <div className="b365-profile-tabs" role="tablist" aria-label="Authentication">
            {(['login', 'signup', ...(isFirebaseConfigured() ? ['phone'] : [])] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                className={tab === t ? 'active' : ''}
                disabled={authBusy}
                onClick={() => setTab(t)}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {tab !== 'phone' && error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {tab !== 'phone' && message ? <AuthAlert variant="success">{message}</AuthAlert> : null}

          {tab === 'login' && (
            <form className="b365-auth-card b365-card b365-auth-form" onSubmit={onLogin} autoComplete="on">
              <fieldset className="b365-auth-fieldset" disabled={loginLoading}>
                <label className="b365-field-label">
                  Username
                  <input
                    name="username"
                    className="b365-input b365-auth-input"
                    value={liUser}
                    onChange={(e) => setLiUser(e.target.value)}
                    autoComplete="username"
                    placeholder="Your username"
                    required
                  />
                </label>
                <label className="b365-field-label">
                  Password
                  <input
                    name="password"
                    type="password"
                    className="b365-input b365-auth-input"
                    value={liPass}
                    onChange={(e) => setLiPass(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Your password"
                    required
                  />
                </label>
                <AuthSubmitButton loading={loginLoading} loadingLabel="Signing in…">
                  Log in
                </AuthSubmitButton>
              </fieldset>
              <p className="b365-auth-switch">
                No account?{' '}
                <button type="button" className="b365-auth-link" disabled={authBusy} onClick={() => setTab('signup')}>
                  Sign up
                </button>
              </p>
            </form>
          )}

          {tab === 'phone' && isFirebaseConfigured() && (
            <>
              {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
              {message ? <AuthAlert variant="success">{message}</AuthAlert> : null}
              <PhoneAuthPanel
                onSuccess={(msg) => {
                  setMessage(msg);
                  setError(null);
                }}
                onError={(msg) => {
                  setError(msg);
                  setMessage(null);
                }}
              />
            </>
          )}

          {tab === 'signup' && (
            <form className="b365-auth-card b365-card b365-auth-form" onSubmit={onSignup} autoComplete="on">
              <fieldset className="b365-auth-fieldset" disabled={signupLoading}>
                <label className="b365-field-label">
                  Username
                  <input
                    name="username"
                    className="b365-input b365-auth-input"
                    value={suUser}
                    onChange={(e) => setSuUser(e.target.value)}
                    autoComplete="username"
                    placeholder="Choose a username"
                    required
                  />
                </label>
                <label className="b365-field-label">
                  Phone <span className="b365-label-optional">optional</span>
                  <input
                    name="phone"
                    className="b365-input b365-auth-input"
                    value={suPhone}
                    onChange={(e) => setSuPhone(e.target.value)}
                    autoComplete="tel"
                    placeholder="0912345678"
                  />
                </label>
                <label className="b365-field-label">
                  Password
                  <input
                    name="password"
                    type="password"
                    className="b365-input b365-auth-input"
                    value={suPass}
                    onChange={(e) => setSuPass(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                  />
                </label>
                <label className="b365-field-label">
                  Confirm password
                  <input
                    name="password2"
                    type="password"
                    className="b365-input b365-auth-input"
                    value={suPass2}
                    onChange={(e) => setSuPass2(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Repeat password"
                    required
                  />
                </label>
                <AuthSubmitButton loading={signupLoading} loadingLabel="Creating account…">
                  Sign up
                </AuthSubmitButton>
              </fieldset>
              <p className="b365-auth-switch">
                Already have an account?{' '}
                <button type="button" className="b365-auth-link" disabled={authBusy} onClick={() => setTab('login')}>
                  Log in
                </button>
              </p>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
