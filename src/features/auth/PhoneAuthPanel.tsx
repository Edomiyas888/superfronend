import { useEffect, useRef, useState } from 'react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signOut,
  type ConfirmationResult,
} from 'firebase/auth';
import AuthSubmitButton from '../../components/auth/AuthSubmitButton';
import { getFirebaseAuth, isFirebasePhoneTesting } from '../../lib/firebase';
import { friendlyFirebaseAuthError, toE164Ethiopian } from './firebasePhone';
import { useSessionStore } from './sessionStore';

type Step = 'phone' | 'code' | 'register';

type Props = {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
};

const STEP_LABELS: Record<Step, string> = {
  phone: 'Number',
  code: 'Verify',
  register: 'Account',
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
    if (isFirebasePhoneTesting()) {
      const auth = getFirebaseAuth();
      auth.settings.appVerificationDisabledForTesting = true;
    }
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
      onSuccess('Code sent. Enter the 6-digit code from SMS (or your test code).');
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
        onSuccess('Phone verified. Choose a username and password to finish.');
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

  const stepOrder: Step[] = ['phone', 'code', 'register'];
  const currentStepIndex = stepOrder.indexOf(step);

  return (
    <div className="b365-auth-card b365-card b365-auth-form b365-phone-auth">
      <div className="b365-phone-steps" aria-label="Phone sign-in progress">
        {stepOrder.map((s, i) => {
          const active = step === s;
          const done = currentStepIndex > i;
          return (
            <span
              key={s}
              className={`b365-phone-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}
            >
              {STEP_LABELS[s]}
            </span>
          );
        })}
      </div>

      {isFirebasePhoneTesting() ? (
        <p className="b365-auth-hint b365-phone-test-hint">
          Test mode: use a fictional number from Firebase console (e.g. <code>09115553434</code>).
        </p>
      ) : (
        <p className="b365-auth-hint">Real SMS requires Firebase Blaze billing.</p>
      )}

      {step === 'phone' && (
        <fieldset className="b365-auth-fieldset" disabled={busy}>
          <label className="b365-field-label">
            Phone number
            <input
              className="b365-input b365-auth-input"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="0912345678"
              autoComplete="tel"
            />
          </label>
          <div id="firebase-recaptcha-container" className="b365-recaptcha-container" />
          <AuthSubmitButton
            type="button"
            loading={busy}
            loadingLabel="Sending code…"
            disabled={!phoneInput.trim()}
            onClick={() => void sendCode()}
          >
            Send verification code
          </AuthSubmitButton>
        </fieldset>
      )}

      {step === 'code' && (
        <fieldset className="b365-auth-fieldset" disabled={busy}>
          <label className="b365-field-label">
            Verification code
            <input
              className="b365-input b365-auth-input b365-auth-input--code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </label>
          <AuthSubmitButton
            type="button"
            loading={busy}
            loadingLabel="Verifying…"
            disabled={code.trim().length < 4}
            onClick={() => void confirmCode()}
          >
            Verify code
          </AuthSubmitButton>
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
        </fieldset>
      )}

      {step === 'register' && (
        <form onSubmit={(e) => void completeRegistration(e)}>
          <fieldset className="b365-auth-fieldset" disabled={busy}>
            <p className="b365-auth-verified-phone">
              Verified: <strong>{verifiedPhone || phoneInput}</strong>
            </p>
            <label className="b365-field-label">
              Username
              <input
                className="b365-input b365-auth-input"
                value={regUser}
                onChange={(e) => setRegUser(e.target.value)}
                autoComplete="username"
                placeholder="Choose a username"
                required
              />
            </label>
            <label className="b365-field-label">
              Password
              <input
                type="password"
                className="b365-input b365-auth-input"
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                autoComplete="new-password"
                placeholder="At least 6 characters"
                required
                minLength={6}
              />
            </label>
            <label className="b365-field-label">
              Confirm password
              <input
                type="password"
                className="b365-input b365-auth-input"
                value={regPass2}
                onChange={(e) => setRegPass2(e.target.value)}
                autoComplete="new-password"
                placeholder="Repeat password"
                required
              />
            </label>
            <AuthSubmitButton loading={busy} loadingLabel="Creating account…">
              Create account
            </AuthSubmitButton>
          </fieldset>
        </form>
      )}
    </div>
  );
}
