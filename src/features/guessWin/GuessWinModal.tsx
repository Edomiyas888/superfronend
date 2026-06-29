import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { GuessWinMatch } from '../../api/guessWinApi';
import { submitGuessWinScore } from '../../api/guessWinApi';
import AuthForms from '../../components/AuthForms';
import LockGlyph from '../../components/LockGlyph';
import { useSessionStore } from '../auth/sessionStore';
import type { AuthTab } from '../auth/authUtils';
import { resolveGuessWinLogoUrl } from '../../utils/guessWinLogoUrl';
import { GAW_TITLE } from './labels';
import { formatWinPrizeLabel } from './prize';

type Props = {
  match: GuessWinMatch;
  onClose: () => void;
};

function normalizeScoreInput(raw: string): string | null {
  const s = raw.trim().replace(/\s+/g, '').replace(':', '-');
  if (!/^\d{1,2}-\d{1,2}$/.test(s)) return null;
  return s;
}

function formatKickoff(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (d.toDateString() === today.toDateString()) return `Today · ${time}`;
  const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${date} · ${time}`;
}

function ScoreDisplay({ score, large }: { score: string; large?: boolean }) {
  const [home, away] = score.split('-');
  return (
    <div className={`b365-gaw-modal__score-display${large ? ' b365-gaw-modal__score-display--large' : ''}`}>
      <span>{home}</span>
      <span className="b365-gaw-modal__score-sep">:</span>
      <span>{away}</span>
    </div>
  );
}

function TeamBadge({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = resolveGuessWinLogoUrl(logoUrl);
  const showImg = src && !failed;

  return (
    <div className="b365-gaw-modal__team">
      <div className="b365-gaw-modal__logo-wrap">
        {showImg ? (
          <img src={src} alt="" className="b365-gaw-modal__logo" onError={() => setFailed(true)} />
        ) : (
          <span className="b365-gaw-modal__logo-fallback" aria-hidden>
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <span className="b365-gaw-modal__team-name">{name}</span>
    </div>
  );
}

function LockedGuessPanel({
  guess,
  presetScores,
}: {
  guess: string;
  presetScores: string[];
}) {
  const blurredScores = presetScores.slice(0, 6);

  return (
    <div className="b365-gaw-modal__locked" aria-live="polite">
      <div className="b365-gaw-modal__locked-blur" aria-hidden>
        <div className="b365-gaw-modal__scores">
          {blurredScores.map((score) => (
            <div key={score} className="b365-gaw-modal__score b365-gaw-modal__score--ghost">
              <span className="b365-gaw-modal__score-home">{score.split('-')[0]}</span>
              <span className="b365-gaw-modal__score-sep">:</span>
              <span className="b365-gaw-modal__score-away">{score.split('-')[1]}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="b365-gaw-modal__locked-overlay">
        <div className="b365-gaw-modal__locked-icon-wrap">
          <LockGlyph className="b365-gaw-modal__locked-icon" />
        </div>
        <p className="b365-gaw-modal__locked-title">Already submitted</p>
        <p className="b365-gaw-modal__locked-hint">Your prediction is locked for this match.</p>
        <ScoreDisplay score={guess} large />
      </div>
    </div>
  );
}

export default function GuessWinModal({ match, onClose }: Props) {
  const queryClient = useQueryClient();
  const { username, getAuthHeader } = useSessionStore();
  const loggedIn = Boolean(username);
  const [selected, setSelected] = useState('');
  const [customHome, setCustomHome] = useState('');
  const [customAway, setCustomAway] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [authTab, setAuthTab] = useState<AuthTab>('login');
  const [liveCount, setLiveCount] = useState(match.displayGuessCount ?? 0);
  const [lockedGuess, setLockedGuess] = useState<string | null>(match.userGuess);

  useEffect(() => {
    setLiveCount(match.displayGuessCount ?? 0);
  }, [match.displayGuessCount]);

  useEffect(() => {
    setLockedGuess(match.userGuess);
  }, [match.userGuess]);

  const kickoffLabel = formatKickoff(match.kickoffAt);
  const winPrizeLabel = formatWinPrizeLabel(match.prizeText || '50,000');
  const prizeSubtitle =
    match.prizeText &&
    !/guess the score/i.test(match.prizeText) &&
    !/^\s*\d[\d,]*\s*$/.test(match.prizeText)
      ? match.prizeText
      : null;
  const presetScores = useMemo(() => {
    const base = match.suggestedScores?.length
      ? match.suggestedScores
      : ['1-0', '2-1', '1-1', '2-0', '0-0', '3-1'];
    if (lockedGuess && !base.includes(lockedGuess)) {
      return [lockedGuess, ...base];
    }
    return base;
  }, [match.suggestedScores, lockedGuess]);

  const customScore = useMemo(() => {
    if (!customHome.trim() || !customAway.trim()) return null;
    return normalizeScoreInput(`${customHome}-${customAway}`);
  }, [customHome, customAway]);

  const effectiveScore = useCustom ? customScore : selected;
  const isLocked = loggedIn && Boolean(lockedGuess);

  const patchMatchInCache = useCallback(
    (patch: Partial<GuessWinMatch> & { userGuess?: string | null }) => {
      const token = useSessionStore.getState().token;
      queryClient.setQueryData(
        ['guess-win-matches', token ?? 'guest'],
        (old: GuessWinMatch[] | undefined) =>
          old?.map((m) => (m.id === match.id ? { ...m, ...patch } : m))
      );
    },
    [match.id, queryClient]
  );

  const submitM = useMutation({
    mutationFn: () => {
      if (!effectiveScore) throw new Error('Pick or enter a valid score (e.g. 2-1).');
      if (lockedGuess) throw new Error('You already submitted a guess for this match.');
      return submitGuessWinScore(match.id, effectiveScore, getAuthHeader());
    },
    onSuccess: (data) => {
      setError(null);
      setSuccess(`Locked in ${data.score}! Good luck.`);
      setLockedGuess(data.score);
      const nextCount = data.displayGuessCount ?? liveCount;
      setLiveCount(nextCount);
      patchMatchInCache({ displayGuessCount: nextCount, userGuess: data.score });
    },
    onError: (err) => {
      const e = err as Error & {
        alreadySubmitted?: boolean;
        score?: string;
        displayGuessCount?: number;
      };
      if (e.alreadySubmitted && e.score) {
        setLockedGuess(e.score);
        setError(null);
        setSuccess(null);
        if (e.displayGuessCount != null) setLiveCount(e.displayGuessCount);
        patchMatchInCache({ userGuess: e.score, displayGuessCount: e.displayGuessCount });
        return;
      }
      setSuccess(null);
      setError(e.message);
    },
  });

  const onBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="b365-gaw-modal-backdrop" role="presentation" onClick={onBackdrop}>
      <div
        className={`b365-gaw-modal${isLocked ? ' b365-gaw-modal--locked' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gaw-modal-title"
      >
        <button type="button" className="b365-gaw-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="b365-gaw-modal__hero">
          <span className="b365-gaw-modal__badge">{GAW_TITLE}</span>
          <p className="b365-gaw-modal__guess-count">
            <span className="b365-gaw-modal__guess-count-dot" aria-hidden />
            {liveCount.toLocaleString('en-US')} guesses
          </p>
          <p className="b365-gaw-modal__win-prize">{winPrizeLabel}</p>
          {prizeSubtitle ? <p className="b365-gaw-modal__prize">{prizeSubtitle}</p> : null}
          {kickoffLabel ? <p className="b365-gaw-modal__kickoff">{kickoffLabel}</p> : null}
        </div>

        <div className="b365-gaw-modal__matchup">
          <TeamBadge name={match.team1Name} logoUrl={match.team1LogoUrl} />
          <div className="b365-gaw-modal__vs">
            <span>VS</span>
            {lockedGuess ? <strong className="b365-gaw-modal__saved">{lockedGuess}</strong> : null}
          </div>
          <TeamBadge name={match.team2Name} logoUrl={match.team2LogoUrl} />
        </div>

        {!loggedIn ? (
          <div className="b365-gaw-modal__auth">
            <p className="b365-gaw-modal__hint">Sign in to submit your score prediction.</p>
            <AuthForms
              tab={authTab}
              onTabChange={setAuthTab}
              variant="modal"
              onAuthenticated={() => {
                setAuthTab('login');
                void queryClient.invalidateQueries({ queryKey: ['guess-win-matches'] });
              }}
            />
          </div>
        ) : isLocked && lockedGuess ? (
          <LockedGuessPanel guess={lockedGuess} presetScores={presetScores} />
        ) : (
          <>
            <div className="b365-gaw-modal__section">
              <h3 id="gaw-modal-title">Pick your score</h3>
              <div className="b365-gaw-modal__scores">
                {presetScores.map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={`b365-gaw-modal__score${!useCustom && selected === score ? ' is-selected' : ''}`}
                    onClick={() => {
                      setUseCustom(false);
                      setSelected(score);
                      setError(null);
                      setSuccess(null);
                    }}
                  >
                    <span className="b365-gaw-modal__score-home">{score.split('-')[0]}</span>
                    <span className="b365-gaw-modal__score-sep">:</span>
                    <span className="b365-gaw-modal__score-away">{score.split('-')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="b365-gaw-modal__section b365-gaw-modal__custom">
              <button
                type="button"
                className={`b365-gaw-modal__custom-toggle${useCustom ? ' is-active' : ''}`}
                onClick={() => {
                  setUseCustom(true);
                  setError(null);
                  setSuccess(null);
                }}
              >
                Custom score
              </button>
              {useCustom ? (
                <div className="b365-gaw-modal__custom-fields">
                  <label>
                    <span>{match.team1Name}</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={customHome}
                      onChange={(e) => setCustomHome(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="0"
                      aria-label={`${match.team1Name} goals`}
                    />
                  </label>
                  <span className="b365-gaw-modal__custom-dash">–</span>
                  <label>
                    <span>{match.team2Name}</span>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={2}
                      value={customAway}
                      onChange={(e) => setCustomAway(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="0"
                      aria-label={`${match.team2Name} goals`}
                    />
                  </label>
                </div>
              ) : null}
            </div>

            {error ? <p className="b365-gaw-modal__error">{error}</p> : null}
            {success ? <p className="b365-gaw-modal__success">{success}</p> : null}

            <button
              type="button"
              className="b365-gaw-modal__submit"
              disabled={!effectiveScore || submitM.isPending}
              onClick={() => submitM.mutate()}
            >
              {submitM.isPending ? 'Saving…' : 'Submit prediction'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
