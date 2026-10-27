import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Today's deposit happy hour: deposits made 21:00–22:00 EAT are doubled. The bonus is
 * credited by hand by the admins, so this card only announces it and counts down; it
 * disappears on its own once the hour is over.
 */
const STARTS_AT = Date.parse('2026-10-25T21:00:00+03:00');
const ENDS_AT = Date.parse('2026-10-25T22:00:00+03:00');

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

type Props = {
  /** On the wallet page the deposit form is already here — switch to it instead of navigating. */
  onDeposit?: () => void;
};

export default function HappyHourCard({ onDeposit }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Date.now() >= ENDS_AT) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (now >= ENDS_AT) return null;
  const live = now >= STARTS_AT;

  return (
    <section className={`b365-happy-hour${live ? ' is-live' : ''}`} aria-label="Happy hour deposit bonus">
      <div className="b365-happy-hour__top">
        <span className="b365-happy-hour__badge">
          {live ? (
            <>
              <span className="b365-happy-hour__dot" aria-hidden />
              Live now
            </>
          ) : (
            'Tonight · 21:00–22:00'
          )}
        </span>
        <span className="b365-happy-hour__timer" aria-live="off">
          {live ? 'Ends in' : 'Starts in'} <b>{formatCountdown((live ? ENDS_AT : STARTS_AT) - now)}</b>
        </span>
      </div>

      <h2 className="b365-happy-hour__title">
        Happy Hour <span>2× your deposit</span>
      </h2>
      <p className="b365-happy-hour__am" lang="am">
        ከምሽቱ 3:00–4:00 ሰዓት ያስገቡትን ገንዘብ በእጥፍ ያግኙ! 🔥
      </p>
      <p className="b365-happy-hour__sub">
        Deposit between 21:00 and 22:00 and we double it. Bonus added to your balance after your deposit is approved.
        The bonus has to be wagered before it can be withdrawn — see Bonus balance in your wallet for the rules.
      </p>

      {live ? (
        onDeposit ? (
          <button type="button" className="b365-happy-hour__cta" onClick={onDeposit}>
            Deposit now
          </button>
        ) : (
          <Link to="/wallet" className="b365-happy-hour__cta">
            Deposit now
          </Link>
        )
      ) : null}
    </section>
  );
}
