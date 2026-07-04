import { useNavigate } from 'react-router-dom';
import fastKenoLogo from '../../../../reference/safarigames-assets/images/image.png';
import './keno-mini-appbar.css';

export default function KenoMiniAppBar() {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <header className="keno-mini-appbar">
      <div className="keno-mini-appbar__inner">
        <button
          type="button"
          className="keno-mini-appbar__back"
          aria-label="Back"
          onClick={handleBack}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <img src={fastKenoLogo} alt="Fast Keno" className="keno-mini-appbar__logo" draggable={false} />
      </div>
    </header>
  );
}
