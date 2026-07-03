import { useEffect, useRef, useState } from 'react';
import trophyIcon from '../assets/world-cup-trophy.webp';

type Props = {
  className?: string;
  animated?: boolean;
};

export default function WorldCupTrophyIcon({ className = '', animated = true }: Props) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, []);

  return (
    <img
      ref={imgRef}
      src={trophyIcon}
      alt=""
      aria-hidden="true"
      draggable={false}
      onLoad={() => setLoaded(true)}
      className={[
        'b365-wc-trophy-icon',
        animated ? 'b365-wc-trophy-icon--safari' : '',
        loaded ? 'b365-wc-trophy-icon--loaded' : 'b365-wc-trophy-icon--loading',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
