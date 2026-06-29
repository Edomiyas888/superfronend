import { useRef, useState } from 'react';
import { useGuessWinMatches } from '../../hooks/useGuessWinMatches';
import type { GuessWinMatch } from '../../api/guessWinApi';
import GuessWinModal from './GuessWinModal';
import LockGlyph from '../../components/LockGlyph';
import { resolveGuessWinLogoUrl } from '../../utils/guessWinLogoUrl';
import { GAW_TITLE } from './labels';
import { extractPrizeAmount } from './prize';

function formatKickoffShort(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (d.toDateString() === today.toDateString()) return time;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatGuessCount(n: number): string {
  return Math.max(0, n).toLocaleString('en-US');
}

function LiveGuessCount({ count }: { count: number }) {
  return (
    <span className="b365-gaw-card__guess-count" aria-label={`${formatGuessCount(count)} guesses`}>
      <span className="b365-gaw-card__guess-count-dot" aria-hidden />
      <span className="b365-gaw-card__guess-count-value">{formatGuessCount(count)}</span>
    </span>
  );
}

function PrizeTag({ amount }: { amount: string }) {
  return (
    <span className="b365-gaw-card__prize-tag" aria-label={`Prize ${amount}`}>
      <span className="b365-gaw-card__prize-tag-glow" aria-hidden />
      <span className="b365-gaw-card__prize-tag-shine" aria-hidden />
      <span className="b365-gaw-card__prize-tag-value">{amount}</span>
    </span>
  );
}

function MatchCard({
  match,
  onSelect,
}: {
  match: GuessWinMatch;
  onSelect: (m: GuessWinMatch) => void;
}) {
  const kickoff = formatKickoffShort(match.kickoffAt);
  const prizeAmount = extractPrizeAmount(match.prizeText || '50,000');
  const isLocked = Boolean(match.userGuess);

  return (
    <button
      type="button"
      className={`b365-gaw-card${isLocked ? ' b365-gaw-card--locked' : ''}`}
      onClick={() => onSelect(match)}
      aria-label={
        isLocked
          ? `${match.team1Name} vs ${match.team2Name}, your guess ${match.userGuess}`
          : `${match.team1Name} vs ${match.team2Name}, predict score`
      }
    >
      <div className="b365-gaw-card__glow" aria-hidden />
      {isLocked ? (
        <span className="b365-gaw-card__lock-badge" aria-hidden>
          <LockGlyph className="b365-gaw-card__lock-icon" />
        </span>
      ) : null}

      <span className="b365-gaw-card__brand">
        <span className="b365-gaw-card__brand-title">{GAW_TITLE}</span>
        <LiveGuessCount count={match.displayGuessCount ?? 0} />
      </span>

      <div className="b365-gaw-card__matchup">
        <div className="b365-gaw-card__team">
          <TeamLogo name={match.team1Name} url={match.team1LogoUrl} />
          <span className="b365-gaw-card__name">{match.team1Name}</span>
        </div>

        <div className="b365-gaw-card__mid">
          <span className="b365-gaw-card__vs">vs</span>
          {kickoff ? <span className="b365-gaw-card__time">{kickoff}</span> : null}
          {match.userGuess ? (
            <span className="b365-gaw-card__picked">
              <LockGlyph className="b365-gaw-card__picked-lock" />
              {match.userGuess}
            </span>
          ) : null}
        </div>

        <div className="b365-gaw-card__team">
          <TeamLogo name={match.team2Name} url={match.team2LogoUrl} />
          <span className="b365-gaw-card__name">{match.team2Name}</span>
        </div>
      </div>

      <PrizeTag amount={prizeAmount} />
    </button>
  );
}

function TeamLogo({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  const src = resolveGuessWinLogoUrl(url);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        className="b365-gaw-card__logo"
        loading="lazy"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span className="b365-gaw-card__logo-fallback" aria-hidden>
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}

function SkeletonCard() {
  return (
    <div className="b365-gaw-card b365-gaw-card--skeleton" aria-hidden>
      <div className="b365-gaw-skel b365-gaw-skel--brand" />
      <div className="b365-gaw-skel b365-gaw-skel--teams" />
      <div className="b365-gaw-skel b365-gaw-skel--tag" />
    </div>
  );
}

export default function GuessAndWinSection() {
  const { data, isLoading, isError } = useGuessWinMatches();
  const [active, setActive] = useState<GuessWinMatch | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (isError) return null;
  if (!isLoading && (!data || data.length === 0)) return null;

  const matches = data ?? [];

  return (
    <section className="b365-gaw" aria-label={GAW_TITLE}>
      <div className="b365-gaw__track" ref={scrollRef}>
        {isLoading ? <SkeletonCard /> : matches.map((m) => <MatchCard key={m.id} match={m} onSelect={setActive} />)}
      </div>

      {active ? <GuessWinModal match={active} onClose={() => setActive(null)} /> : null}
    </section>
  );
}
