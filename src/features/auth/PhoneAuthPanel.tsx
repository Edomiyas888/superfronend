import { useEffect, useRef, useState } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from 'firebase/auth';
import { getFirebaseAuth } from '../../lib/firebase';
import { friendlyFirebaseAuthError, toE164Ethiopian } from './firebasePhone';
import { useSessionStore } from './sessionStore';

type Step = 'phone' | 'code' | 'register';

type Props = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

export default function PhoneAuthPanel({ onSuccess, onError }: Props) {
  const loginWithFirebase = useSessionStore((s) => s.loginWithFirebase);

  const [step, setStep] = useState<Step>('phone');
  const [phoneInput, setPhoneInput] = useState('');
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [code, setCode] = useState('');
  const [regUser, setRegUser] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [busy, setBusy] = useState(false);
  const [idToken, setIdToken] = useState('');

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    return () => {
      recaptchaRef.current?.clear();
      recaptchaRef.current = null;
    };
  }, []);

  const ensureRecaptcha = () => {
    if (recaptchaRef.current) {
      return recaptchaRef.current;
    }
    const auth = getFirebaseAuth();
    const verifier = new RecaptchaVerifier(auth, 'firebase-recaptcha-container', {
      size: 'normal',
    });
    recaptchaRef.current = verifier;
    return verifier;
  };

  const resetRecaptcha = async () => {
    recaptchaRef.current?.clear();
    recaptchaRef.current = null;
    const container = document.getElementById('firebase-recaptcha-container');
    if (container) {
      container.innerHTML = '';
    }
  };

  const sendCode = async () => {
    onError('');
    setBusy(true);
    try {
      const phoneNumber = toE164Ethiopian(phoneInput);
      const auth = getFirebaseAuth();
      const appVerifier = ensureRecaptcha();
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      confirmationRef.current = confirmation;
      setStep('code');
      onSuccess('SMS sent. Enter the 6-digit code (or your Firebase test code).');
    } catch (err) {
      onError(friendlyFirebaseAuthError(err));
      await resetRecaptcha();
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async () => {
    onError('');
    setBusy(true);
    try {
      const confirmation = confirmationRef.current;
      if (!confirmation) {
        throw new Error('Request a code first.');
      }
      const result = await confirmation.confirm(code.trim());
      const token = await result.user.getIdToken();
      setIdToken(token);

      const exchange = await loginWithFirebase(token);
      if (exchange.needsRegistration) {
        setVerifiedPhone(exchange.phone);
        setStep('register');
        onSuccess('Phone verified. Choose a username and password to finish sign-up.');
        return;
      }

      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* session is on superbet-api JWT */
      }
      onSuccess('Signed in with your phone number.');
    } catch (err) {
      onError(friendlyFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const completeRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    onError('');
    if (regPass !== regPass2) {
      onError('Passwords do not match.');
      return;
    }
    if (regPass.length < 6) {
      onError('Password must be at least 6 characters.');
      return;
    }
    if (!idToken) {
      onError('Verification expired. Start again from your phone number.');
      setStep('phone');
      return;
    }

    setBusy(true);
    try {
      const exchange = await loginWithFirebase(idToken, {
        username: regUser,
        password: regPass,
      });
      if (exchange.needsRegistration) {
        throw new Error('Could not create account. Try verifying your phone again.');
      }
      try {
        await signOut(getFirebaseAuth());
      } catch {
        /* ignore */
      }
      onSuccess('Account created. You are signed in.');
    } catch (err) {
      onError(friendlyFirebaseAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card b365-card b365-auth-form">
      <h2 className="b365-profile-heading">Phone sign-in</h2>
      <p className="b365-muted b365-profile-note">
        Sign in with SMS verification via Firebase. Standard message rates may apply.
      </p>

      {step === 'phone' && (
        <>
          <label className="b365-field-label">
            Phone number
            <input
              className="b365-input"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="0912345678"
              autoComplete="tel"
            />
          </label>
          <div id="firebase-recaptcha-container" className="b365-recaptcha-container" />
          <button
            type="button"
            className="b365-btn-primary b365-btn-block"
            disabled={busy || !phoneInput.trim()}
            onClick={() => void sendCode()}
          >
            {busy ? 'Sending…' : 'Send verification code'}
          </button>
        </>
      )}

      {step === 'code' && (
        <>
          <label className="b365-field-label">
            Verification code
            <input
              className="b365-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          <button
            type="button"
            className="b365-btn-primary b365-btn-block"
            disabled={busy || code.trim().length < 4}
            onClick={() => void confirmCode()}
          >
            {busy ? 'Verifying…' : 'Verify code'}
          </button>
          <button
            type="button"
            className="b365-btn-secondary b365-btn-block b365-phone-back-btn"
            disabled={busy}
            onClick={() => {
              setStep('phone');
              setCode('');
              confirmationRef.current = null;
              void resetRecaptcha();
            }}
          >
            Use a different number
          </button>
        </>
      )}

      {step === 'register' && (
        <form onSubmit={(e) => void completeRegistration(e)}>
          <p className="b365-muted b365-profile-note">
            Verified phone: <strong>{verifiedPhone || phoneInput}</strong>
          </p>
          <label className="b365-field-label">
            Username
            <input
              className="b365-input"
              value={regUser}
              onChange={(e) => setRegUser(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="b365-field-label">
            Password
            <input
              type="password"
              className="b365-input"
              value={regPass}
              onChange={(e) => setRegPass(e.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
            />
          </label>
          <label className="b365-field-label">
            Confirm password
            <input
              type="password"
              className="b365-input"
              value={regPass2}
              onChange={(e) => setRegPass2(e.target.value)}
              autoComplete="new-password"
              required
            />
          </label>
          <button type="submit" className="b365-btn-primary b365-btn-block" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}
    </div>
  );
}
