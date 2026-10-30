import { createPortal } from 'react-dom';
import splashLogo from '../assets/splash-logo.png';
import '../keno-splash.css';

/**
 * Atlas loader: the logo dimmed, with a full-colour copy wiping across it once a second.
 * It disappears at once (no fade) as soon as the game is ready.
 */
export default function KenoSplashScreen() {
  return createPortal(
    <div className="keno-splash" role="status" aria-live="polite" aria-label="Loading Fast Keno">
      <div className="keno-splash__inner">
        <img src={splashLogo} alt="" className="keno-splash__logo1" draggable={false} />
        <img src={splashLogo} alt="" className="keno-splash__logo2" draggable={false} />
      </div>
    </div>,
    document.body
  );
}
