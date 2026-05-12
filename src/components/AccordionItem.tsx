import { useId, type ReactNode } from 'react';

export type AccordionItemProps = {
  title: string;
  children: ReactNode;
  /** When false, title is static and children are always visible (no chevron / collapse). */
  collapsible?: boolean;
  isOpen?: boolean;
  onToggle?: () => void;
};

export default function AccordionItem({
  title,
  children,
  collapsible = true,
  isOpen = true,
  onToggle,
}: AccordionItemProps) {
  const panelId = useId();

  if (!collapsible) {
    return (
      <div className="b365-sidebar-acc-item b365-sidebar-acc-item--static">
        <div className="b365-sidebar-acc-static-title">{title}</div>
        <div className="b365-sidebar-acc-body">{children}</div>
      </div>
    );
  }

  return (
    <div className="b365-sidebar-acc-item">
      <button
        type="button"
        className={`b365-sidebar-acc-trigger ${isOpen ? 'b365-sidebar-acc-trigger--open' : ''}`}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="b365-sidebar-acc-trigger-text">{title}</span>
        <span className="b365-sidebar-acc-chevron-wrap" aria-hidden>
          <svg className="b365-sidebar-acc-chevron" viewBox="0 0 24 24" focusable="false">
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      <div id={panelId} className={`b365-sidebar-acc-panel ${isOpen ? 'b365-sidebar-acc-panel--open' : ''}`}>
        <div className="b365-sidebar-acc-panel-inner">{children}</div>
      </div>
    </div>
  );
}
