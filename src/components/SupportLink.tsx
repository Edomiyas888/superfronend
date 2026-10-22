import type { MouseEvent, ReactNode } from 'react';
import { SUPPORT_TELEGRAM_URL } from '../config/support';
import { isTelegramMiniApp, openTelegramLink } from '../lib/telegram/webApp';

type Props = {
  className?: string;
  'aria-label'?: string;
  title?: string;
  children: ReactNode;
};

/** Link to the Telegram support chat; inside the Mini App it opens natively instead of a browser tab. */
export default function SupportLink({ children, ...rest }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isTelegramMiniApp()) return;
    e.preventDefault();
    openTelegramLink(SUPPORT_TELEGRAM_URL);
  };

  return (
    <a href={SUPPORT_TELEGRAM_URL} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>
      {children}
    </a>
  );
}
