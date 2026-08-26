import { Link } from 'react-router-dom';
import PremierLeagueTrophyIcon from './PremierLeagueTrophyIcon';

export default function PremierLeagueButton() {
  return (
    <Link to="/premier-league" className="b365-motd-epl-btn">
      <span className="b365-motd-epl-btn__glow" aria-hidden />
      <span className="b365-motd-epl-btn__shimmer" aria-hidden />
      <span className="b365-motd-epl-btn__inner">
        <span className="b365-motd-epl-btn__icon" aria-hidden>
          <PremierLeagueTrophyIcon className="b365-motd-epl-btn__trophy" />
        </span>
        <span className="b365-motd-epl-btn__text">
          <span className="b365-motd-epl-btn__title">Premier</span>
          <span className="b365-motd-epl-btn__year">League</span>
        </span>
        <span className="b365-motd-epl-btn__arrow" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </Link>
  );
}
