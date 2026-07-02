import { Link } from 'react-router-dom';
import FastKenoNavIcon from './FastKenoNavIcon';
import kenoGridGif from '@/features/keno/assets/greengif.gif';

export default function FastKenoPromoButton() {
  return (
    <Link to="/keno" className="b365-motd-keno-btn" aria-label="Fast Keno">
      <span
        className="b365-motd-keno-btn__grid"
        style={{ backgroundImage: `url(${kenoGridGif})` }}
        aria-hidden="true"
      />
      <span className="b365-motd-keno-btn__glow" aria-hidden="true" />
      <span className="b365-motd-keno-btn__inner">
        <span className="b365-motd-keno-btn__logo-wrap">
          <FastKenoNavIcon animated className="b365-motd-keno-btn__logo" />
        </span>
        <span className="b365-motd-keno-btn__label">
          Fast Keno
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
