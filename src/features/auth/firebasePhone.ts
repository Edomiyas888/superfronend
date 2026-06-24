/** Ethiopian local input → E.164 (+251…) for Firebase phone auth. */
export function toE164Ethiopian(raw: string): string {
  const digits = String(raw ?? '').replace(/\D/g, '');

  if (digits.startsWith('251') && digits.length >= 12) {
    return `+${digits.slice(0, 12)}`;
  }
  if (digits.startsWith('0') && digits.length >= 10) {
    return `+251${digits.slice(1, 10)}`;
  }
  if (digits.length === 9) {
    return `+251${digits}`;
  }

  throw new Error('Enter a valid Ethiopian phone number (e.g. 0912345678).');
}

export function friendlyFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'Invalid phone number format.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/invalid-verification-code':
      return 'Invalid verification code.';
    case 'auth/code-expired':
      return 'Code expired. Request a new one.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA failed. Refresh and try again.';
    case 'auth/missing-phone-number':
      return 'Phone number is required.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded. Try a test number or wait.';
    default:
      if (err instanceof Error && err.message) {
        return err.message;
      }
      return 'Phone verification failed.';
  }
}
