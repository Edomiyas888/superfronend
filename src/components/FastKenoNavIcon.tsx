import fastKenoLogo from '@/features/keno/assets/fastloader.png';

type Props = {
  className?: string;
  animated?: boolean;
};

export default function FastKenoNavIcon({ className = '', animated = false }: Props) {
  return (
    <span
      className={`b365-keno-logo ${animated ? 'b365-keno-logo--animated' : ''} ${className}`.trim()}
      style={{ backgroundImage: `url(${fastKenoLogo})` }}
      aria-hidden="true"
    />
  );
}
