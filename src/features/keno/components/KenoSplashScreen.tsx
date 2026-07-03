import fastKenoLogo from '../assets/fastloader.png';
import KenoMiniAppBar from './KenoMiniAppBar';
import '../keno-splash.css';

type Props = {
  exiting?: boolean;
};

export default function KenoSplashScreen({ exiting = false }: Props) {
  return (
    <div
      className={`keno-splash${exiting ? ' keno-splash--exit' : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Loading Fast Keno"
    >
      <div className="keno-splash__bg" aria-hidden="true" />
      <KenoMiniAppBar />
      <div className="keno-splash__content">
        <img src={fastKenoLogo} alt="" className="keno-splash__logo" draggable={false} />
        <p className="keno-splash__title">Fast Keno</p>
        <p className="keno-splash__sub">Preparing your game…</p>
        <div className="keno-splash__bar" aria-hidden="true">
          <span className="keno-splash__bar-fill" />
        </div>
      </div>
    </div>
  );
}
