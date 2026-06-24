import { formatLiveScoreTimeLine, type LiveGameDisplay } from '../utils/matchLiveDisplay';

type Props = {
  live?: LiveGameDisplay | null;
  className?: string;
};

export default function BetslipLiveLine({ live, className = 'b365-betslip-live-line' }: Props) {
  const text = formatLiveScoreTimeLine(live);
  if (!text) return null;

  return (
    <div className={className}>
      <span className="b365-betslip-live-badge">LIVE</span>
      <span className="b365-betslip-live-text">{text}</span>
    </div>
  );
}
