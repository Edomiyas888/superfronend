import type { LiveLastEvent, MatchDetailView } from '../api/types';
import { GAME_EVENT_SOCCER } from '../constants/liveGameEvents';

const ANIM_FRESH_MS = 120_000;

function isSoccerAlias(alias: string | undefined): boolean {
  if (!alias) return true;
  const a = alias.toLowerCase().trim();
  return a === 'soccer' || a === 'football';
}

function eventFresh(last: LiveLastEvent | null | undefined): boolean {
  if (!last?.time_utc) return true;
  const t = new Date(last.time_utc).getTime();
  if (!Number.isFinite(t)) return true;
  return Date.now() - t < ANIM_FRESH_MS;
}

function formatEventLabel(key: string): string {
  return key.replace(/([a-z])([A-Z])/g, '$1 $2').trim();
}

type Props = {
  sportAlias?: string;
  team1: string;
  team2: string;
  live?: MatchDetailView['live'];
  homeScore?: number;
  awayScore?: number;
};

export default function LiveMatchAnimation({ sportAlias, team1, team2, live, homeScore, awayScore }: Props) {
  const info = live?.info ?? undefined;
  const s1 =
    info && info.score1 != null && info.score1 !== ''
      ? String(info.score1)
      : homeScore != null
        ? String(homeScore)
        : '–';
  const s2 =
    info && info.score2 != null && info.score2 !== ''
      ? String(info.score2)
      : awayScore != null
        ? String(awayScore)
        : '–';

  const last = live?.lastEvent;
  const typeId = last?.type_id;
  const eventKey = typeId != null ? GAME_EVENT_SOCCER[Number(typeId)] : undefined;
  const showEventAnim = !!(last && eventKey && eventFresh(last));
  const side = last?.side === '2' ? 'away' : 'home';

  const fieldRaw =
    (info && info.field != null ? String(info.field) : null) ??
    (live?.field != null ? String(live.field) : null) ??
    '1';
  const fieldClass = `b365-live-pitch__field--${fieldRaw.replace(/[^a-z0-9_-]/gi, '') || '1'}`;

  const soccer = isSoccerAlias(sportAlias);

  return (
    <div className={`b365-live-anim ${soccer ? 'b365-live-anim--soccer' : 'b365-live-anim--generic'}`}>
      <div className="b365-live-anim__scorebar">
        <span className="b365-live-anim__team b365-live-anim__team--home">{team1}</span>
        <div className="b365-live-anim__score">
          <span>{s1}</span>
          <span className="b365-live-anim__score-sep" aria-hidden>
            :
          </span>
          <span>{s2}</span>
        </div>
        <span className="b365-live-anim__team b365-live-anim__team--away">{team2}</span>
      </div>

      <div className="b365-live-pitch" aria-label="Live match animation">
        <div className={`b365-live-pitch__field ${soccer ? fieldClass : 'b365-live-pitch__field--arena'}`}>
          {soccer ? (
            <>
              <div className="b365-live-pitch__line b365-live-pitch__line--mid" />
              <div className="b365-live-pitch__circle" />
              <div className="b365-live-pitch__goal b365-live-pitch__goal--l" />
              <div className="b365-live-pitch__goal b365-live-pitch__goal--r" />
            </>
          ) : null}

          {soccer ? (
            showEventAnim && eventKey ? (
              <div
                className={`b365-live-pitch__overlay b365-live-pitch__overlay--evt b365-live-pitch__overlay--${eventKey} b365-live-pitch__overlay--${side}`}
              >
                {(eventKey === 'DangerousAttack' || eventKey === 'KickOff') && (
                  <div className="b365-live-pitch__attack">
                    <span className="b365-live-pitch__attack-arrow" />
                  </div>
                )}
                {eventKey === 'Goal' ? (
                  <div className="b365-live-pitch__goal-burst">
                    <span className="b365-live-pitch__ball" />
                  </div>
                ) : null}
                {eventKey === 'Corner' || eventKey === 'ThrowIn' ? (
                  <span className="b365-live-pitch__ball b365-live-pitch__ball--sm" />
                ) : null}
                {eventKey === 'YellowCard' || eventKey === 'RedCard' ? (
                  <span className={`b365-live-pitch__card b365-live-pitch__card--${eventKey === 'RedCard' ? 'red' : 'yellow'}`} />
                ) : null}
                {(eventKey === 'FreeKick' || eventKey === 'GoalKick' || eventKey === 'Penalty') && (
                  <>
                    <span className="b365-live-pitch__ripple" />
                    <span className="b365-live-pitch__ball" />
                  </>
                )}
                {eventKey === 'Offside' && (
                  <>
                    <span className="b365-live-pitch__offside-line" />
                    <span className="b365-live-pitch__ball b365-live-pitch__ball--sm" />
                  </>
                )}
                <p className="b365-live-pitch__event-label">{formatEventLabel(eventKey)}</p>
              </div>
            ) : (
              <div className="b365-live-pitch__overlay b365-live-pitch__overlay--idle">
                <span className="b365-live-pitch__ball b365-live-pitch__ball--float" />
                <p className="b365-live-pitch__event-label">In play</p>
              </div>
            )
          ) : (
            <div className="b365-live-pitch__overlay b365-live-pitch__overlay--generic">
              <span className="b365-live-pitch__pulse-ring" />
              <p className="b365-live-pitch__event-label">Live</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
