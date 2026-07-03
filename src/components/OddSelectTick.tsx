type Props = {
  pulseKey: number;
  visible: boolean;
};

export default function OddSelectTick({ pulseKey, visible }: Props) {
  if (!visible || !pulseKey) return null;

  return (
    <span key={pulseKey} className="b365-odd-tick" aria-hidden="true">
      <span className="b365-odd-tick__glow" />
      <svg viewBox="0 0 24 24" fill="none">
        <circle className="b365-odd-tick__ring" cx="12" cy="12" r="9.5" />
        <path className="b365-odd-tick__check" d="M7.2 12.4 10.4 15.6 16.8 8.8" />
      </svg>
    </span>
  );
}
