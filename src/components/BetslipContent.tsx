import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBetslipStore } from '../features/betslip/betslipStore';
import { useSessionStore } from '../features/auth/sessionStore';
import { fetchBalance } from '../features/wallet/walletApi';
import BetslipMyBetsPanel from './BetslipMyBetsPanel';
import BetslipSelectionCard from './BetslipSelectionCard';
import { MAX_POSSIBLE_WIN, MIN_STAKE, formatLimit } from '../config/bettingLimits';
import { formatOdds } from '../utils/formatOdds';

type MainTab = 'slip' | 'my-bets';

type Props = {
  /** Drawer only — renders the collapse chevron in the header row. */
  onClose?: () => void;
};

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17 9h-1V7a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-7-2a2 2 0 0 1 4 0v2h-4V7Z" />
    </svg>
  );
}

/** Shared betslip body — desktop rail + mobile drawer. */
export default function BetslipContent({ onClose }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('slip');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
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
  const acceptOddsChanges = useBetslipStore((s) => s.acceptOddsChanges);
  const setAcceptOddsChanges = useBetslipStore((s) => s.setAcceptOddsChanges);
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

  useEffect(() => {
    if (shareState !== 'copied') return;
    const t = window.setTimeout(() => setShareState('idle'), 2000);
    return () => window.clearTimeout(t);
  }, [shareState]);

  const ids = Object.keys(events);
  const count = ids.length;
  const hasSelections = count > 0;
  const balance = walletQ.data?.balance ?? null;
  const currency = walletQ.data?.currency ?? 'ETB';
  const isAccumulator = count > 1;

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

  const hasPendingCorrection =
    (correctionPending?.length ?? 0) > 0 && !correctionsAccepted && !acceptOddsChanges;
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

  // Largest stake the balance and the max-return cap both allow.
  const maxStake =
    balance != null && combinedOdds > 0
      ? Math.floor(Math.min(balance, MAX_POSSIBLE_WIN / combinedOdds) * 100) / 100
      : null;

  const betTypes = [
    {
      id: 'single',
      label: 'Single',
      active: count === 1,
      locked: count > 1,
      hint: 'Singles take one selection',
    },
    {
      id: 'multi',
      label: 'Multi',
      active: count > 1,
      locked: count < 2,
      hint: 'Add another selection for a multi',
    },
    {
      id: 'system',
      label: 'System',
      active: false,
      locked: true,
      hint: 'System bets are not available',
    },
  ];

  const share = async () => {
    const lines = ids
      .map((id) => events[id])
      .filter((ev): ev is NonNullable<typeof ev> => Boolean(ev))
      .map((ev) => `${ev.teamone} v ${ev.teamtwo} — ${ev.marketName}: ${ev.pick} @ ${formatOdds(ev.price)}`);
    const text = [...lines, `Total odds: ${formatOdds(combinedOdds)}`].join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Bet slip', text });
        return;
      }
      await navigator.clipboard.writeText(text);
      setShareState('copied');
    } catch {
      /* share sheet dismissed / clipboard blocked */
    }
  };

  return (
    <div className="b365-slip">
      <div className="b365-slip-head">
        <button
          type="button"
          className={`b365-slip-gear${settingsOpen ? ' active' : ''}`}
          aria-label="Bet slip settings"
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M19.14 12.94a7.5 7.5 0 0 0 .05-.94 7.5 7.5 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.66 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.5 7.5 0 0 0 0 1.88l-2.03 1.58a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.39.3.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.54c.05.24.26.42.5.42h3.84c.25 0 .45-.18.5-.42l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7Z" />
          </svg>
        </button>
        <div className="b365-slip-tabs" role="tablist" aria-label="Bet slip sections">
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === 'slip'}
            className={`b365-slip-tab${mainTab === 'slip' ? ' active' : ''}`}
            onClick={() => setMainTab('slip')}
          >
            Bet Slip
            {count > 0 ? <span className="b365-slip-count">{count}</span> : null}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mainTab === 'my-bets'}
            className={`b365-slip-tab b365-slip-tab--plain${mainTab === 'my-bets' ? ' active' : ''}`}
            onClick={() => setMainTab('my-bets')}
          >
            My Bets
          </button>
        </div>
        {onClose ? (
          <button type="button" className="b365-slip-collapse" onClick={onClose} aria-label="Close bet slip">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M7 6l5 5 5-5M7 13l5 5 5-5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>

      {settingsOpen ? (
        <div className="b365-slip-settings" role="group" aria-label="Odds changes">
          <span className="b365-slip-settings-title">When odds change</span>
          <label className="b365-slip-radio">
            <input
              type="radio"
              name="b365-slip-odds-pref"
              checked={!acceptOddsChanges}
              onChange={() => setAcceptOddsChanges(false)}
            />
            Always ask
          </label>
          <label className="b365-slip-radio">
            <input
              type="radio"
              name="b365-slip-odds-pref"
              checked={acceptOddsChanges}
              onChange={() => setAcceptOddsChanges(true)}
            />
            Accept any change
          </label>
        </div>
      ) : null}

      <div className="b365-slip-body">
        {selectionError ? (
          <p className="b365-slip-notice b365-slip-notice--error" role="alert">
            <span>{selectionError}</span>
            <button type="button" className="b365-slip-notice-dismiss" onClick={() => clearSelectionError()}>
              Dismiss
            </button>
          </p>
        ) : null}

        {mainTab === 'my-bets' ? (
          <BetslipMyBetsPanel authHeaders={getAuthHeader()} loggedIn={loggedIn} />
        ) : !hasSelections ? (
          <>
            {placeStatus === 'success' && placeMessage ? (
              <p className="b365-slip-notice b365-slip-notice--success" role="status">
                {placeMessage}
              </p>
            ) : null}
            <p className="b365-betslip-empty">Click odds to add selections to your bet slip.</p>
          </>
        ) : (
          <>
            <div className="b365-slip-types" role="group" aria-label="Bet type">
              {betTypes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`b365-slip-type${t.active ? ' active' : ''}`}
                  aria-pressed={t.active}
                  disabled={t.locked}
                  title={t.locked ? t.hint : undefined}
                >
                  {t.locked && t.id !== 'system' ? <LockIcon /> : null}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="b365-slip-selections">
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
            </div>

            <button type="button" className="b365-slip-remove-all" onClick={() => clear()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>Remove All</span>
            </button>

            <div className="b365-slip-summary">
              <div className="b365-slip-stake">
                <button
                  type="button"
                  className="b365-slip-max"
                  disabled={maxStake == null || maxStake < MIN_STAKE}
                  onClick={() => maxStake != null && setStake(maxStake)}
                >
                  Max
                </button>
                <label className="b365-slip-stake-field">
                  <span className="b365-slip-stake-currency">{currency}</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={MIN_STAKE}
                    step={0.01}
                    className="b365-slip-stake-input"
                    aria-label="Stake"
                    placeholder="0.00"
                    value={stake || ''}
                    onChange={(e) => setStake(parseFloat(e.target.value) || 0)}
                  />
                </label>
              </div>
              <div className="b365-slip-summary-row">
                <span>Total odds</span>
                <span className="b365-slip-summary-odds">{formatOdds(combinedOdds)}</span>
              </div>
              <div className="b365-slip-summary-row b365-slip-summary-row--win">
                <span>Total win</span>
                <span>
                  {currency} {possibleWin.toFixed(2)}
                </span>
              </div>
            </div>

            {stakeTooLow ? (
              <p className="b365-slip-notice b365-slip-notice--error">Minimum stake is {MIN_STAKE}.</p>
            ) : null}
            {returnTooHigh ? (
              <p className="b365-slip-notice b365-slip-notice--error">
                Maximum return is {formatLimit(MAX_POSSIBLE_WIN)}. Reduce stake or remove selections.
              </p>
            ) : null}
            {stakeTooHigh ? (
              <p className="b365-slip-notice b365-slip-notice--error">
                Insufficient balance ({balance?.toFixed(2)} available).
              </p>
            ) : null}
            {!loggedIn ? <p className="b365-slip-notice">Sign in to place bets.</p> : null}
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

            <label className="b365-slip-agree">
              <input
                type="checkbox"
                checked={acceptOddsChanges}
                onChange={(e) => setAcceptOddsChanges(e.target.checked)}
              />
              <span className="b365-slip-agree-box" aria-hidden="true" />
              Agree to odds changes
            </label>

            {placeMessage ? (
              <p
                className={`b365-slip-notice${placeStatus === 'error' ? ' b365-slip-notice--error' : ''}`}
                role={placeStatus === 'error' ? 'alert' : 'status'}
              >
                {placeMessage}
              </p>
            ) : null}

            <div className="b365-slip-actions">
              <button
                type="button"
                className="b365-slip-share"
                onClick={() => void share()}
                aria-label={shareState === 'copied' ? 'Bet slip copied' : 'Share bet slip'}
                title={shareState === 'copied' ? 'Copied' : 'Share'}
              >
                {shareState === 'copied' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12l5 5 9-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M12 15V3M7 8l5-5 5 5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className="b365-slip-place"
                disabled={!canPlace}
                onClick={() => void placeBet(0)}
              >
                {placeStatus === 'loading' ? 'Placing…' : 'Place Bet'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
