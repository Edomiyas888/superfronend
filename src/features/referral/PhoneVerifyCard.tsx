import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isTelegramMiniApp, requestTelegramPhone } from '../../lib/telegram/webApp';
import { useAuthHeaders, verifyTelegramPhone } from './referralApi';

type Props = {
  title: string;
  sub: string;
};

/** One tap: Telegram shares the player's own (Telegram-verified) number with the API. */
export default function PhoneVerifyCard({ title, sub }: Props) {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inTelegram = isTelegramMiniApp();

  const onVerify = async () => {
    setError(null);
    setBusy(true);
    try {
      const response = await requestTelegramPhone();
      if (!response) {
        setError('ስልክ ቁጥር አልተጋራም። እንደገና ይሞክሩ። · Phone not shared — try again.');
        return;
      }
      await verifyTelegramPhone(headers, response);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] }),
        queryClient.invalidateQueries({ queryKey: ['referrals'] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify your phone.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="b365-phone-card" aria-label="Verify phone number">
      <span className="b365-phone-card__icon" aria-hidden>
        📱
      </span>
      <div className="b365-phone-card__text">
        <p className="b365-phone-card__title">{title}</p>
        <p className="b365-phone-card__sub">{sub}</p>
        {error ? (
          <p className="b365-phone-card__error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      {inTelegram ? (
        <button type="button" className="b365-phone-card__cta" disabled={busy} onClick={() => void onVerify()}>
          {busy ? '…' : 'ስልክ ያጋሩ'}
        </button>
      ) : (
        <span className="b365-phone-card__hint">Open in Telegram</span>
      )}
    </section>
  );
}
