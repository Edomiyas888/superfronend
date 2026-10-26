import { MAX_SPINS_PER_EVENT, SPIN_TIERS, nextTier, formatWhole, spinsLabel } from './spinRules';

/** Bar position for a deposit total, with the tiers spaced evenly along it. */
function barPercent(total: number) {
  let prev = 0;
  for (const [i, { at }] of SPIN_TIERS.entries()) {
    if (total < at) {
      return ((i + (total - prev) / (at - prev)) / SPIN_TIERS.length) * 100;
    }
    prev = at;
  }
  return 100;
}

type Props = {
  deposited: number;
  pending: number;
  currency: string;
  /** False once the event hour is over — no more spins can be earned. */
  live: boolean;
};

/** The event's deposit total against the spin tiers. */
export default function SpinProgress({ deposited, pending, currency, live }: Props) {
  const next = nextTier(deposited);
  const pct = barPercent(deposited);

  return (
    <div className="b365-spin-progress">
      <p className="b365-spin-progress__head">
        Deposited this hour <b>{Math.floor(deposited).toLocaleString('en-US')} {currency}</b>
      </p>
      <div
        className="b365-spin-progress__bar"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        aria-label="Progress to your next spin"
      >
        <span style={{ width: `${pct}%` }} />
      </div>
      <ol className="b365-spin-progress__tiers">
        {SPIN_TIERS.map((t) => (
          <li key={t.at} className={deposited >= t.at ? 'is-done' : ''}>
            <b>{t.at.toLocaleString('en-US')}</b>
            <span>{spinsLabel(t.spins)}</span>
          </li>
        ))}
      </ol>
      {pending > 0 ? (
        <p className="b365-spin-progress__pending">
          {formatWhole(pending)} {currency} is being reviewed. It counts as soon as it&apos;s approved.
        </p>
      ) : null}
      <p className="b365-spin-progress__next">
        {!next
          ? `You've earned all ${MAX_SPINS_PER_EVENT} spins. Good luck!`
          : live
            ? `Deposit ${formatWhole(next.remaining)} ${currency} more this hour to earn spin #${next.spins}`
            : 'Spin & Win is over for this hour.'}
      </p>
    </div>
  );
}
