import { useState } from 'react';
import { useSessionStore } from '../features/auth/sessionStore';
import { friendlyAuthError, type AuthTab } from '../features/auth/authUtils';

type Props = {
  tab: AuthTab;
  onTabChange: (t: AuthTab) => void;
  variant: 'page' | 'modal';
  /** Called after successful login or sign-up (e.g. close modal). */
  onAuthenticated?: () => void;
};

export default function AuthForms({ tab, onTabChange, variant, onAuthenticated }: Props) {
  const { register, login } = useSessionStore();
  const [suUser, setSuUser] = useState('');
  const [suPhone, setSuPhone] = useState('');
  const [suPass, setSuPass] = useState('');
  const [suPass2, setSuPass2] = useState('');
  const [liUser, setLiUser] = useState('');
  const [liPass, setLiPass] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isModal = variant === 'modal';
  const formCardClass = isModal ? 'b365-auth-form-card' : 'card b365-card b365-auth-form';
  const tabsClass = isModal ? 'b365-auth-modal-tabs' : 'b365-profile-tabs';

  const switchTab = (t: AuthTab) => {
    onTabChange(t);
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
      onAuthenticated?.();
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
      onAuthenticated?.();
    } catch (err) {
      setError(friendlyAuthError(err, 'Could not sign in.'));
    }
  };

  return (
    <>
      <div className={tabsClass}>
        <button type="button" className={tab === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>
          Log in
        </button>
        <button type="button" className={tab === 'signup' ? 'active' : ''} onClick={() => switchTab('signup')}>
          Join
        </button>
      </div>

      {tab === 'login' && (
        <form className={formCardClass} onSubmit={onLogin} autoComplete="on">
          <h2 className="b365-profile-heading">{isModal ? 'Welcome back' : 'Log in'}</h2>
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
          {message && !isModal && <p className="b365-success">{message}</p>}
          <button type="submit" className="b365-btn-primary b365-btn-block">
            Log in
          </button>
        </form>
      )}

      {tab === 'signup' && (
        <form className={formCardClass} onSubmit={onSignup} autoComplete="on">
          <h2 className="b365-profile-heading">{isModal ? 'Create your account' : 'Create account'}</h2>
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
          {message && !isModal && <p className="b365-success">{message}</p>}
          <button type="submit" className="b365-btn-primary b365-btn-block">
            Sign up
          </button>
        </form>
      )}
    </>
  );
}
