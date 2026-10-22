import { SUPPORT_TELEGRAM_HANDLE } from '../config/support';
import SupportLink from './SupportLink';
import TelegramGlyph from './TelegramGlyph';

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
        <SupportLink className="b365-app-footer-support" aria-label={`Support on Telegram, @${SUPPORT_TELEGRAM_HANDLE}`}>
          <TelegramGlyph size={16} />
          <span>Support: @{SUPPORT_TELEGRAM_HANDLE}</span>
        </SupportLink>
        <div className="b365-app-footer-meta">
          <span className="b365-app-footer-age" aria-label="Adults only">
            18+
          </span>
          <span className="b365-app-footer-copy">
            © {year} S Bet · Play responsibly
          </span>
        </div>
      </div>
    </footer>
  );
}
