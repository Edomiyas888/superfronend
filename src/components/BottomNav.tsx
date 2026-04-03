import { NavLink, useLocation } from 'react-router-dom';

function useSportsNavActive(): boolean {
  const { pathname } = useLocation();
  return pathname === '/sports' || pathname.startsWith('/sport/');
}

export default function BottomNav() {
  const sportsActive = useSportsNavActive();

  return (
    <nav className="b365-bottom-nav" aria-label="Main">
      <NavLink to="/" end className={({ isActive }) => `b365-bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="b365-bottom-nav-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="b365-bottom-nav-label">Home</span>
      </NavLink>

      <NavLink
        to="/sports"
        className={({ isActive }) =>
          `b365-bottom-nav-item ${isActive || sportsActive ? 'active' : ''}`
        }
      >
        <span className="b365-bottom-nav-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="b365-bottom-nav-label">Sports</span>
      </NavLink>

      <NavLink to="/live" className={({ isActive }) => `b365-bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="b365-bottom-nav-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12a10 10 0 0 1 10-10" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
            <path d="M12 6v2M12 16v2M6 12h2M16 12h2" strokeLinecap="round" />
          </svg>
        </span>
        <span className="b365-bottom-nav-label">In-Play</span>
      </NavLink>

      <NavLink to="/my-bets" className={({ isActive }) => `b365-bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="b365-bottom-nav-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" strokeLinecap="round" />
            <path d="M9 12h6M9 16h4" strokeLinecap="round" />
          </svg>
        </span>
        <span className="b365-bottom-nav-label">My bets</span>
      </NavLink>

      <NavLink to="/profile" className={({ isActive }) => `b365-bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="b365-bottom-nav-icon" aria-hidden>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21a8 8 0 1 0-16 0" strokeLinecap="round" />
            <circle cx="12" cy="8" r="4" />
          </svg>
        </span>
        <span className="b365-bottom-nav-label">Profile</span>
      </NavLink>
    </nav>
  );
}
