import { Link } from 'react-router-dom';
import WorldCupTrophyIcon from './WorldCupTrophyIcon';

export default function WorldCup2026Button() {
  return (
    <Link to="/world-cup-2026" className="b365-motd-wc-btn">
      <span className="b365-motd-wc-btn__glow" aria-hidden />
      <span className="b365-motd-wc-btn__shimmer" aria-hidden />
      <span className="b365-motd-wc-btn__inner">
        <span className="b365-motd-wc-btn__icon" aria-hidden>
          <WorldCupTrophyIcon className="b365-motd-wc-btn__trophy" />
        </span>
        <span className="b365-motd-wc-btn__text">
          <span className="b365-motd-wc-btn__title">World Cup</span>
          <span className="b365-motd-wc-btn__year">2026</span>
        </span>
        <span className="b365-motd-wc-btn__arrow" aria-hidden>
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
