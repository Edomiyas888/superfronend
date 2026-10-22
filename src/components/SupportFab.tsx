import { SUPPORT_TELEGRAM_HANDLE } from '../config/support';
import SupportLink from './SupportLink';
import TelegramGlyph from './TelegramGlyph';

export default function SupportFab() {
  return (
    <SupportLink
      className="b365-support-fab"
      aria-label={`Support on Telegram, @${SUPPORT_TELEGRAM_HANDLE}`}
      title={`Support: @${SUPPORT_TELEGRAM_HANDLE}`}
    >
      <TelegramGlyph size={26} />
    </SupportLink>
  );
}
