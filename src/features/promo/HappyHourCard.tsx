import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchHappyHour, type HappyHourEvent } from './happyHourApi';

/**
 * The deposit Happy Hour an admin started from the admin panel. Deposits submitted in the
 * window earn the bonus automatically when approved, so this card only announces the event
 * and counts down; it shows up and disappears on its own.
 */

const TZ = 'Africa/Addis_Ababa';

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Hour and minute in East Africa time. */
function eatParts(ms: number) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date(ms));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { h: get('hour'), m: get('minute') };
}

function eatClock(ms: number) {
  const { h, m } = eatParts(ms);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function eatDay(ms: number) {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Ethiopian clock: 12-hour count from 6 o'clock, so 22:30 is 4:30 in the evening. */
function ethiopianClock(ms: number) {
  const { h, m } = eatParts(ms);
  const hour = (h + 6) % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')}`;
}

function ethiopianPeriod(ms: number) {
  const { h } = eatParts(ms);
  if (h >= 6 && h < 12) return 'ከጠዋቱ';
  if (h >= 12 && h < 18) return 'ከሰዓት በኋላ';
  if (h >= 18) return 'ከምሽቱ';
  return 'ከሌሊቱ';
}

/** "2× your deposit" / "+50% on your deposit". */
function offerHeadline(bonusPercent: number) {
  const times = 1 + bonusPercent / 100;
  return Number.isInteger(times) ? `${times}× your deposit` : `+${bonusPercent}% on your deposit`;
}

function amharicOffer(bonusPercent: number) {
  const times = 1 + bonusPercent / 100;
  if (times === 2) return 'በእጥፍ';
  if (Number.isInteger(times)) return `${times} እጥፍ`;
  return `+${bonusPercent}% ጉርሻ`;
}

function dayLabel(startsAt: number, now: number) {
  if (eatDay(startsAt) === eatDay(now)) return eatParts(startsAt).h >= 18 ? 'Tonight' : 'Today';
  return new Date(startsAt).toLocaleDateString('en-GB', { timeZone: TZ, weekday: 'long' });
}

type Props = {
  /** On the wallet page the deposit form is already here — switch to it instead of navigating. */
  onDeposit?: () => void;
};

export default function HappyHourCard({ onDeposit }: Props) {
  const { data } = useQuery({
    queryKey: ['promo', 'happy-hour'],
    queryFn: fetchHappyHour,
    refetchInterval: 60_000,
  });

  if (!data) return null;
  return <HappyHourBanner event={data.event} multiplier={data.rules.multiplier} minOdds={data.rules.minOdds} onDeposit={onDeposit} />;
}

function HappyHourBanner({
  event,
  multiplier,
  minOdds,
  onDeposit,
}: { event: HappyHourEvent; multiplier: number; minOdds: number } & Props) {
  const startsAt = Date.parse(event.startsAt);
  const endsAt = Date.parse(event.endsAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Date.now() >= endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);

  if (now >= endsAt) return null;
  const live = now >= startsAt;
  const window_ = `${eatClock(startsAt)}–${eatClock(endsAt)}`;
  const offer = event.bonusPercent === 100 ? 'we double it' : `we add ${event.bonusPercent}% as bonus`;

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
            `${dayLabel(startsAt, now)} · ${window_}`
          )}
        </span>
        <span className="b365-happy-hour__timer" aria-live="off">
          {live ? 'Ends in' : 'Starts in'} <b>{formatCountdown((live ? endsAt : startsAt) - now)}</b>
        </span>
      </div>

      <h2 className="b365-happy-hour__title">
        Happy Hour <span>{offerHeadline(event.bonusPercent)}</span>
      </h2>
      <p className="b365-happy-hour__am" lang="am">
        {ethiopianPeriod(startsAt)} {ethiopianClock(startsAt)}–{ethiopianClock(endsAt)} ሰዓት ያስገቡትን ገንዘብ{' '}
        {amharicOffer(event.bonusPercent)} ያግኙ! 🔥
      </p>
      <p className="b365-happy-hour__sub">
        Deposit between {eatClock(startsAt)} and {eatClock(endsAt)} and {offer}
        {event.maxBonus > 0 ? ` (up to ${event.maxBonus} ETB)` : ''}. Bonus added to your balance after your deposit is
        approved. To unlock the bonus as cash, bet {multiplier}× your bonus on bets with total odds above{' '}
        {minOdds.toFixed(2)} — only those bets can use the bonus.
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
