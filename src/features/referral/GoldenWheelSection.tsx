import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import SpinWheel, { type SpinWheelHandle } from '../spin/SpinWheel';
import { PrizeIcon } from '../spin/SpinSprite';
import Confetti from '../spin/Confetti';
import { spinWin, unlockSpinAudio } from '../spin/spinFx';
import { spinsLabel, type WheelSegment } from '../spin/spinRules';
import { GOLDEN_SEGMENTS } from './goldenWheel';
import { spinGoldenWheel, useAuthHeaders } from './referralApi';

/** Golden Wheel for referral milestone spins. Needs SpinSprite on the page. */
export default function GoldenWheelSection({ spins }: { spins: number }) {
  const headers = useAuthHeaders();
  const queryClient = useQueryClient();
  const wheelRef = useRef<SpinWheelHandle>(null);
  const [left, setLeft] = useState(spins);
  const [spinning, setSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [won, setWon] = useState<WheelSegment | null>(null);
  const [error, setError] = useState<string | null>(null);

  const available = Math.max(left, 0);

  const onSpin = async () => {
    if (spinning || available <= 0) return;
    unlockSpinAudio();
    setError(null);
    setWon(null);
    setWinnerIndex(null);
    setSpinning(true);
    try {
      const result = await spinGoldenWheel(headers);
      const index = GOLDEN_SEGMENTS.findIndex((s) => s.id === result.prizeId);
      await wheelRef.current?.spin(index);
      const prize = GOLDEN_SEGMENTS[index] ?? null;
      setWinnerIndex(index);
      setLeft(result.goldenSpins);
      spinWin(true);
      window.setTimeout(() => setWon(prize), 650);
      void queryClient.invalidateQueries({ queryKey: ['wallet'] });
      void queryClient.invalidateQueries({ queryKey: ['referrals'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not spin. Please try again.');
    } finally {
      setSpinning(false);
    }
  };

  return (
    <section className="b365-golden" aria-labelledby="golden-title">
      <h2 id="golden-title" className="b365-golden__title">
        🎡 ወርቃማ ጎማ · Golden Wheel
      </h2>
      <p className="b365-golden__sub">
        እስከ <b>5,000 ብር</b> ቦነስ! · You have <b>{spinsLabel(available)}</b>
      </p>
      <div className="b365-golden__wheel">
        <SpinWheel
          ref={wheelRef}
          segments={GOLDEN_SEGMENTS}
          spinning={spinning}
          winnerIndex={winnerIndex}
          hubLabel="SPIN"
          hubSub={available > 0 ? `${available} left` : undefined}
          hubDisabled={spinning || available <= 0}
          onHubClick={() => void onSpin()}
        />
      </div>
      <button
        type="button"
        className="b365-spin__btn is-ready b365-golden__btn"
        disabled={spinning || available <= 0}
        onClick={() => void onSpin()}
      >
        {spinning ? 'Good luck…' : available > 0 ? 'Spin the Golden Wheel' : 'No Golden spins left'}
      </button>
      {error ? (
        <p className="b365-wallet-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {won ? (
        <div className="b365-spin-result" role="dialog" aria-modal="true" aria-labelledby="golden-won">
          <Confetti pieces={won.tone === 'grand' ? 260 : 160} />
          <div className="b365-spin-result__card is-grand">
            <div className="b365-spin-result__art" aria-hidden>
              <span className="b365-spin-result__rays" />
              <PrizeIcon icon={won.icon} size={96} className="b365-spin-result__icon b365-golden__icon" />
            </div>
            <p className="b365-spin-result__eyebrow">Golden Wheel</p>
            <p id="golden-won" className="b365-spin-result__amount">
              +{won.amount.toLocaleString('en-US')} ETB
            </p>
            <p className="b365-spin-result__kind">Bonus</p>
            <p className="b365-spin-result__detail">{won.detail}</p>
            {available > 0 ? (
              <button type="button" className="b365-spin__btn" onClick={() => void onSpin()}>
                Spin again · {spinsLabel(available)} left
              </button>
            ) : (
              <button type="button" className="b365-spin__btn" onClick={() => setWon(null)}>
                Done
              </button>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
