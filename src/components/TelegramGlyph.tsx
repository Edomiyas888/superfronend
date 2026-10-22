/** Telegram paper-plane logo (fills with `currentColor`). */
export default function TelegramGlyph({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21.94 4.66 18.9 19.01c-.23 1.01-.83 1.26-1.68.79l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.6-7.77c.37-.33-.08-.52-.58-.19L7.12 12.99 2.54 11.56c-1-.31-1.01-1 .21-1.48L20.6 3.2c.83-.31 1.55.19 1.34 1.46Z" />
    </svg>
  );
}
