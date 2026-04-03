import { useEffect, useMemo, useState } from 'react';
import { teamLogoUrlCandidates } from '../utils/teamLogos';

export type TeamLogoProps = {
  teamId: number | undefined;
  name: string;
  /** Classes for the `<img>` when a CDN URL is used */
  className?: string;
  /** Classes for the letter fallback when no image is shown */
  fallbackClassName?: string;
};

/**
 * Logiq CDN team crests (same sources as Match of the Day). Falls back to an initial when no id or load fails.
 */
export default function TeamLogo({ teamId, name, className, fallbackClassName }: TeamLogoProps) {
  const candidates = useMemo(() => {
    if (teamId == null || !Number.isFinite(teamId) || teamId <= 0) return [];
    return teamLogoUrlCandidates(teamId);
  }, [teamId]);
  const [srcIdx, setSrcIdx] = useState(0);
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setSrcIdx(0);
  }, [teamId]);

  if (candidates.length === 0 || srcIdx >= candidates.length) {
    return (
      <div className={fallbackClassName?.trim() || undefined} aria-hidden>
        {initial}
      </div>
    );
  }

  return (
    <img
      src={candidates[srcIdx]}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      decoding="async"
      onError={() => setSrcIdx((i) => i + 1)}
    />
  );
}
