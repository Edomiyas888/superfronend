import { Link } from 'react-router-dom';
import PremierLeagueTrophyIcon from './PremierLeagueTrophyIcon';
import fastKenoLogo from '../assets/fast-keno-logo-user.png';
import liveIcon from '../assets/home-live.png';
import betSlipsIcon from '../assets/home-bet-slips.png';

const actions = [
  {
    to: '/premier-league',
    label: 'EPL',
    className: 'b365-home-action--epl',
    kind: 'trophy' as const,
  },
  {
    to: '/keno',
    label: 'Fast Keno',
    className: 'b365-home-action--keno',
    kind: 'keno-logo' as const,
    icon: fastKenoLogo,
    alt: 'Fast Keno',
  },
  {
    to: '/live',
    label: 'Live',
    className: 'b365-home-action--live',
    kind: 'image' as const,
    icon: liveIcon,
    alt: 'Live betting',
  },
  {
    to: '/my-bets',
    label: 'My bets',
    className: 'b365-home-action--bets',
    kind: 'image' as const,
    icon: betSlipsIcon,
    alt: 'My bet slips',
  },
] as const;

export default function HomeQuickActions() {
  return (
    <nav className="b365-home-actions" aria-label="Quick links">
      <ul className="b365-home-actions__list">
        {actions.map((action) => (
          <li key={action.to} className="b365-home-actions__item">
            <Link to={action.to} className={`b365-home-action ${action.className}`}>
              <span className="b365-home-action__visual" aria-hidden="true">
                <span className="b365-home-action__glow" />
                {action.kind === 'trophy' ? (
                  <PremierLeagueTrophyIcon className="b365-home-action__epl-trophy" />
                ) : action.kind === 'keno-logo' ? (
                  <img
                    src={action.icon}
                    alt={action.alt}
                    className="b365-home-action__asset b365-home-action__asset--keno-logo"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <img
                    src={action.icon}
                    alt={action.alt}
                    className="b365-home-action__asset"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </span>
              <span className="b365-home-action__label">{action.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
