import wheelImage from '../../assets/home-spin.webp';
import { spinPhase, useSpinStatus } from './spinApi';
import { formatWhole, nextTier, spinsForTotal, spinsLabel } from './spinRules';

type Props = {
  /** The amount typed into the deposit form, or null while it is empty or invalid. */
  amount: number | null;
  currency: string;
  /** Raises the typed amount — wired to the "Add X" nudge. */
  onSetAmount: (amount: number) => void;
};

/**
 * Under the deposit amount while Spin & Win is live: spins this deposit earns, and how little
 * more reaches the next one. Counts pending deposits too, since they count once approved.
 */
export default function SpinDepositHint({ amount, currency, onSetAmount }: Props) {
  const { data: status } = useSpinStatus();
  const player = status?.player;
  if (!status || !player || spinPhase(status.event, Date.now()) !== 'live') return null;

  const before = player.deposited + player.pending;
  const after = before + (amount ?? 0);
  const gained = spinsForTotal(after) - spinsForTotal(before);
  const next = nextTier(after);
  // Only nudge when the next spin is within reach of what they're already depositing.
  const nudge = next && amount != null && next.remaining <= Math.max(amount, 100) ? next : null;

  let text: string;
  if (gained > 0) {
    text = `This deposit earns you ${spinsLabel(gained)} on the prize wheel`;
  } else if (next) {
    text = `Deposit ${formatWhole(next.remaining)} ${currency}${amount ? ' more' : ''} this hour to earn a spin`;
  } else if (amount == null) {
    return null;
  } else {
    text = `You've earned all your spins for this hour`;
  }

  return (
    <div className="b365-spin-hint">
      <img src={wheelImage} alt="" className="b365-spin-hint__wheel" draggable={false} />
      <p>{text}</p>
      {nudge && amount != null ? (
        <button type="button" onClick={() => onSetAmount(Math.ceil(amount + nudge.remaining))}>
          +{formatWhole(nudge.remaining)} for spin #{nudge.spins}
        </button>
      ) : null}
    </div>
  );
}
