export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="b365-app-footer" role="contentinfo">
      <div className="b365-app-footer-inner">
        <nav className="b365-app-footer-nav" aria-label="Footer links">
          <a href="#main">Help</a>
          <a href="#main">Rules</a>
          <a href="#main">Responsible gambling</a>
          <a href="#main">Terms</a>
          <a href="#main">Privacy</a>
        </nav>
        <div className="b365-app-footer-meta">
          <span className="b365-app-footer-age" aria-label="Adults only">
            18+
          </span>
          <span className="b365-app-footer-copy">
            © {year} Superbet · Demo UI · Play responsibly
          </span>
        </div>
      </div>
    </footer>
  );
}
