import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBetslipStore } from '../features/betslip/betslipStore';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletApi';
import BetslipMyBetsPanel from './BetslipMyBetsPanel';
import BetslipSelectionCard from './BetslipSelectionCard';
import WalletBalanceSummary from './WalletBalanceSummary';
import { MAX_POSSIBLE_WIN, MIN_STAKE, formatLimit } from '../config/bettingLimits';

type MainTab = 'slip' | 'my-bets';

/** Shared betslip body — desktop rail + mobile drawer. */
export default function BetslipContent() {
  const [mainTab, setMainTab] = useState<MainTab>('slip');
  const events = useBetslipStore((s) => s.events);
  const liveByGameId = useBetslipStore((s) => s.liveByGameId);
  const stake = useBetslipStore((s) => s.stake);
  const setStake = useBetslipStore((s) => s.setStake);
  const removeSelection = useBetslipStore((s) => s.removeSelection);
  const clear = useBetslipStore((s) => s.clear);
  const placeBet = useBetslipStore((s) => s.placeBet);
  const placeStatus = useBetslipStore((s) => s.placeStatus);
  const placeMessage = useBetslipStore((s) => s.placeMessage);
  const correctionPending = useBetslipStore((s) => s.correctionPending);
  const correctionsAccepted = useBetslipStore((s) => s.correctionsAccepted);
  const acceptCorrections = useBetslipStore((s) => s.acceptCorrections);
  const selectionError = useBetslipStore((s) => s.selectionError);
  const clearSelectionError = useBetslipStore((s) => s.clearSelectionError);
  const { username, getAuthHeader } = useSessionStore();
  const loggedIn = !!username;

  const walletQ = useQuery({
    queryKey: ['wallet', 'header'],
    queryFn: () => fetchBalance(getAuthHeader()),
    enabled: loggedIn,
    staleTime: 15_000,
  });

  const ids = Object.keys(events);
  const hasSelections = ids.length > 0;
  const balance = walletQ.data?.balance ?? null;
  const withdrawable = walletQ.data?.withdrawable ?? null;
  const nonWithdrawable = walletQ.data?.nonWithdrawable ?? null;
  const currency = walletQ.data?.currency ?? 'ETB';
  const isAccumulator = ids.length > 1;

  const combinedOdds = ids.reduce((acc, id) => {
    const ev = events[id];
    if (!ev) return acc;
    return acc * (ev.price || 1);
  }, 1);

  const totalStake = isAccumulator
    ? stake
    : ids.reduce((acc, id) => {
        const ev = events[id];
        if (!ev) return acc;
        const s =
          Number.isFinite(Number(ev.singleStake)) && Number(ev.singleStake) > 0
            ? Number(ev.singleStake)
            : stake;
        return acc + s;
      }, 0);

  const possibleWin = isAccumulator
    ? stake * combinedOdds
    : ids.reduce((acc, id) => {
        const ev = events[id];
        if (!ev) return acc;
        const s =
          Number.isFinite(Number(ev.singleStake)) && Number(ev.singleStake) > 0
            ? Number(ev.singleStake)
            : stake;
        return acc + s * (ev.price || 1);
      }, 0);

  const hasPendingCorrection = (correctionPending?.length ?? 0) > 0 && !correctionsAccepted;
  const pendingCorrectionCount = correctionPending?.length ?? 0;
  const stakeTooLow = stake > 0 && stake < MIN_STAKE;
  const returnTooHigh = possibleWin > MAX_POSSIBLE_WIN;
  const stakeTooHigh = balance != null && totalStake > balance;
  const canPlace =
    placeStatus !== 'loading' &&
    stake >= MIN_STAKE &&
    loggedIn &&
    !hasPendingCorrection &&
    !stakeTooHigh &&
    !returnTooHigh &&
    !ids.some((id) => events[id]?.suspended);

  return (
    <>
      {loggedIn ? (
        <WalletBalanceSummary
          variant="sidebar"
          balance={balance}
          withdrawable={withdrawable}
          nonWithdrawable={nonWithdrawable}
          currency={currency}
          loading={walletQ.isPending}
        />
      ) : null}
      <div className="b365-betslip-tabs" role="tablist" aria-label="Bet slip sections">
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'slip'}
          className={`b365-betslip-tab${mainTab === 'slip' ? ' active' : ''}`}
          onClick={() => setMainTab('slip')}
        >
          Bet Slip
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mainTab === 'my-bets'}
          className={`b365-betslip-tab${mainTab === 'my-bets' ? ' active' : ''}`}
          onClick={() => setMainTab('my-bets')}
        >
          My Bets
        </button>
      </div>

      {selectionError ? (
        <p className="b365-error" role="alert">
          {selectionError}{' '}
          <button type="button" className="b365-btn-ghost" onClick={() => clearSelectionError()}>
            Dismiss
          </button>
        </p>
      ) : null}

      {mainTab === 'my-bets' ? (
        <BetslipMyBetsPanel authHeaders={getAuthHeader()} loggedIn={loggedIn} />
      ) : !hasSelections ? (
        <p className="b365-betslip-empty">Click odds to add selections to your bet slip.</p>
      ) : (
        <>
          {ids.map((id) => {
            const ev = events[id];
            if (!ev) return null;
            return (
              <BetslipSelectionCard
                key={id}
                selectionKey={id}
                event={ev}
                liveInfo={liveByGameId[String(ev.gameId)]}
                onRemove={removeSelection}
              />
            );
          })}
          <label className="b365-field-label">
            Stake
            <input
              type="number"
              min={MIN_STAKE}
              step={0.01}
              className="b365-input"
              value={stake}
              onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
            />
          </label>
          {stakeTooLow ? (
            <p className="b365-error">Minimum stake is {MIN_STAKE}.</p>
          ) : null}
          {isAccumulator ? (
            <p className="b365-muted b365-betslip-hint">
              Accumulator · {ids.length} selections · combined odds {combinedOdds.toFixed(2)}
            </p>
          ) : null}
          <p className="b365-betslip-return">Est. return: {possibleWin.toFixed(2)}</p>
          {returnTooHigh ? (
            <p className="b365-error">
              Maximum return is {formatLimit(MAX_POSSIBLE_WIN)}. Reduce stake or remove selections.
            </p>
          ) : null}
          {!loggedIn ? <p className="b365-muted">Sign in to place bets.</p> : null}
          {stakeTooHigh ? (
            <p className="b365-error">Insufficient balance ({balance?.toFixed(2)} available).</p>
          ) : null}
          <div className="b365-betslip-actions">
            {hasPendingCorrection ? (
              <div className="b365-betslip-accept-odds" role="status">
                <span>
                  {pendingCorrectionCount === 1
                    ? '1 selection updated'
                    : `${pendingCorrectionCount} selections updated`}
                </span>
                <button type="button" className="b365-btn-secondary" onClick={() => acceptCorrections()}>
                  Accept odds
                </button>
              </div>
            ) : null}
            <div className="b365-betslip-actions-row">
            <button
              type="button"
              className="b365-btn-primary"
              disabled={!canPlace}
              onClick={() => void placeBet(0)}
            >
              {placeStatus === 'loading' ? 'Placing…' : 'Place bet'}
            </button>
            <button type="button" className="b365-btn-secondary" onClick={() => clear()}>
              Clear
            </button>
            </div>
          </div>
          {placeMessage && (
            <p className={placeStatus === 'error' ? 'b365-error' : 'b365-muted'}>{placeMessage}</p>
          )}
        </>
      )}
    </>
  );
}
