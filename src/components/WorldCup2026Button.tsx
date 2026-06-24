import { Link } from 'react-router-dom';

export default function WorldCup2026Button() {
  return (
    <Link to="/world-cup-2026" className="b365-motd-wc-btn">
      <span className="b365-motd-wc-btn__glow" aria-hidden />
      <span className="b365-motd-wc-btn__shimmer" aria-hidden />
      <span className="b365-motd-wc-btn__inner">
        <span className="b365-motd-wc-btn__icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 21h8M12 17v4M7 4h10l1 4H6l1-4z"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 8c0 2.5 1.8 4.5 4 4.5s4-2 4-4.5M6 8h12"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
            <path d="M9 12.5h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
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
