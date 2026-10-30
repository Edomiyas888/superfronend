import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSessionStore } from '../auth/sessionStore';
import { fetchHappyHour, type HappyHourEvent, type KenoCashbackProgress } from './happyHourApi';

/**
 * The Happy Hour an admin started from the admin panel. A deposit event pays its bonus
 * automatically when each deposit is approved; a Keno event pays part of the Keno losses back
 * after it ends. So this card only announces the event and counts down (and, for Keno, shows
 * the player's cashback so far); it shows up and disappears on its own.
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

function money(n: number) {
  return `${n.toLocaleString('en-US', { maximumFractionDigits: 2 })} ETB`;
}

/** The live or next Happy Hour, with the signed-in player's Keno cashback when there is one. */
export function useHappyHour() {
  const { token, username, getAuthHeader } = useSessionStore();
  // Stable per token so the query does not refire on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const headers = useMemo(() => getAuthHeader(), [token]);
  return useQuery({
    queryKey: ['promo', 'happy-hour', username ?? 'guest'],
    queryFn: () => fetchHappyHour(headers),
    refetchInterval: 60_000,
  });
}

/** Ticks every second until `endsAt`; returns the current time. */
export function useNow(endsAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (Date.now() >= endsAt) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [endsAt]);
  return now;
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
  const { data } = useHappyHour();

  if (!data) return null;
  if (data.event.kind === 'keno') return <KenoHappyHourBanner event={data.event} me={data.me} onDeposit={onDeposit} />;
  return <HappyHourBanner event={data.event} multiplier={data.rules.multiplier} minOdds={data.rules.minOdds} onDeposit={onDeposit} />;
}

function DepositButton({ onDeposit, label = 'Deposit now' }: Props & { label?: string }) {
  return onDeposit ? (
    <button type="button" className="b365-happy-hour__cta" onClick={onDeposit}>
      {label}
    </button>
  ) : (
    <Link to="/wallet" className="b365-happy-hour__cta">
      {label}
    </Link>
  );
}

/** What the player has done so far in a live Keno Happy Hour. */
function kenoProgressLine(me: KenoCashbackProgress | null) {
  if (!me) return null;
  if (me.deposited <= 0) {
    return me.depositPending ? 'Your deposit is waiting for approval — play once it lands.' : 'Deposit in this hour to qualify.';
  }
  return me.staked > 0
    ? `Your cashback so far: ${money(me.cashback)} (staked ${money(me.staked)}, won ${money(me.won)})`
    : `You qualify with ${money(me.deposited)} deposited — play Fast Keno to earn cashback.`;
}

function KenoHappyHourBanner({ event, me, onDeposit }: { event: HappyHourEvent; me: KenoCashbackProgress | null } & Props) {
  const startsAt = Date.parse(event.startsAt);
  const endsAt = Date.parse(event.endsAt);
  const now = useNow(endsAt);

  if (now >= endsAt) return null;
  const live = now >= startsAt;
  const window_ = `${eatClock(startsAt)}–${eatClock(endsAt)}`;
  const progress = live ? kenoProgressLine(me) : null;
  const qualified = (me?.deposited ?? 0) > 0;

  return (
    <section className={`b365-happy-hour${live ? ' is-live' : ''}`} aria-label="Keno Happy Hour cashback">
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
        Keno Happy Hour <span>{event.bonusPercent}% of your losses back</span>
      </h2>
      <p className="b365-happy-hour__am" lang="am">
        {ethiopianPeriod(startsAt)} {ethiopianClock(startsAt)}–{ethiopianClock(endsAt)} ሰዓት ገንዘብ ያስገቡ፣ ፋስት ኬኖ ይጫወቱ —
        ከተሸነፉበት ገንዘብ {event.bonusPercent}% ይመለስልዎታል! 🎰
      </p>
      <p className="b365-happy-hour__sub">
        Deposit between {eatClock(startsAt)} and {eatClock(endsAt)}, play Fast Keno, and get {event.bonusPercent}% of your
        Keno losses in that hour back, counted up to what you deposited
        {event.maxBonus > 0 ? ` (max ${money(event.maxBonus)})` : ''}. Paid to your balance right after the hour ends.
      </p>
      {progress ? <p className="b365-happy-hour__progress">{progress}</p> : null}

      {live ? (
        qualified ? (
          <Link to="/keno" className="b365-happy-hour__cta">
            Play Fast Keno
          </Link>
        ) : (
          <DepositButton onDeposit={onDeposit} />
        )
      ) : null}
    </section>
  );
}

/** One line at the top of the Keno screen while a Keno Happy Hour is live. */
export function KenoHappyHourStrip() {
  const { data } = useHappyHour();
  const event = data?.event.kind === 'keno' && data.event.live ? data.event : null;
  const now = useNow(event ? Date.parse(event.endsAt) : 0);
  if (!event) return null;
  const left = Date.parse(event.endsAt) - now;
  if (left <= 0) return null;
  const me = data?.me ?? null;
  const qualified = (me?.deposited ?? 0) > 0;

  return (
    <div className="b365-keno-hh" role="status">
      <span className="b365-keno-hh__title">
        <span className="b365-happy-hour__dot" aria-hidden /> Happy Hour · {event.bonusPercent}% back
      </span>
      <span className="b365-keno-hh__timer">{formatCountdown(left)}</span>
      {qualified ? (
        <span className="b365-keno-hh__cash">Cashback {money(me?.cashback ?? 0)}</span>
      ) : (
        <Link to="/wallet" className="b365-keno-hh__cta">
          {me?.depositPending ? 'Deposit pending' : 'Deposit to qualify'}
        </Link>
      )}
    </div>
  );
}

function HappyHourBanner({
  event,
  multiplier,
  minOdds,
  onDeposit,
}: { event: HappyHourEvent; multiplier: number; minOdds: number } & Props) {
  const startsAt = Date.parse(event.startsAt);
  const endsAt = Date.parse(event.endsAt);
  const now = useNow(endsAt);

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

      {live ? <DepositButton onDeposit={onDeposit} /> : null}
    </section>
  );
}
