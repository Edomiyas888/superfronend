import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSessionStore } from '../features/auth/sessionStore';
import PhoneAuthPanel from '../features/auth/PhoneAuthPanel';
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

  const loggedIn = !!(username && username.length > 0);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const setTab = (t: Tab) => {
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
          <p className="b365-muted b365-profile-note">
            Manage your balance on the <Link to="/wallet">Wallet</Link> page.
          </p>
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
            {isFirebaseConfigured() && (
              <button type="button" className={tab === 'phone' ? 'active' : ''} onClick={() => setTab('phone')}>
                Phone
              </button>
            )}
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

          {tab === 'phone' && isFirebaseConfigured() && (
            <>
              {error && <p className="b365-error">{error}</p>}
              {message && <p className="b365-success">{message}</p>}
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
