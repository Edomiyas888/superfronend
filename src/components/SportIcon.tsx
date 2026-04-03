/** Picks a simple line icon from alias + name (Swarm sport metadata). */
import type { ReactNode } from 'react';

type IconProps = { className?: string };

function Svg({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

function resolveKind(alias: string, name: string): string {
  const t = `${alias} ${name}`.toLowerCase();
  if (t.includes('american football') || /\bnfl\b/.test(t)) return 'american-football';
  if (t.includes('soccer') || (t.includes('football') && !t.includes('american'))) return 'soccer';
  if (t.includes('basketball')) return 'basketball';
  if (t.includes('table tennis') || t.includes('ping')) return 'table-tennis';
  if (t.includes('tennis')) return 'tennis';
  if (t.includes('baseball')) return 'baseball';
  if (t.includes('hockey') || t.includes('ice hockey')) return 'hockey';
  if (t.includes('volleyball')) return 'volleyball';
  if (t.includes('rugby')) return 'rugby';
  if (t.includes('cricket')) return 'cricket';
  if (t.includes('golf')) return 'golf';
  if (t.includes('boxing') || t.includes('mma') || t.includes('ufc')) return 'combat';
  if (t.includes('dart')) return 'darts';
  if (t.includes('snooker') || t.includes('billiard')) return 'snooker';
  if (t.includes('badminton')) return 'badminton';
  if (t.includes('handball')) return 'handball';
  if (t.includes('cycling')) return 'cycling';
  if (t.includes('motor') || t.includes('f1') || t.includes('formula')) return 'racing';
  if (t.includes('esport') || t.includes('e-sport') || t.includes('dota') || t.includes('lol')) return 'esports';
  return 'default';
}

export function SportIcon({ alias, name, className }: { alias: string; name: string; className?: string }) {
  const k = resolveKind(alias, name);
  switch (k) {
    case 'soccer':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.8 2.8M14.7 14.7l2.8 2.8M6.5 17.5l2.8-2.8M14.7 9.3l2.8-2.8" />
        </Svg>
      );
    case 'basketball':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18M3 12h18" />
        </Svg>
      );
    case 'tennis':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9" />
        </Svg>
      );
    case 'baseball':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M7 7c4 4 4 10 0 14M17 7c-4 4-4 10 0 14" />
        </Svg>
      );
    case 'hockey':
      return (
        <Svg className={className}>
          <path d="M4 16l3-8 4 2 5-5 4 10-4 2-5-5-4 2z" />
          <circle cx="18" cy="7" r="2" />
        </Svg>
      );
    case 'volleyball':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3v18M3 12h18M5 5l14 14M19 5L5 19" />
        </Svg>
      );
    case 'american-football':
      return (
        <Svg className={className}>
          <ellipse cx="12" cy="12" rx="10" ry="6" />
          <path d="M6 12h12M9 9v6M15 9v6" />
        </Svg>
      );
    case 'rugby':
      return (
        <Svg className={className}>
          <ellipse cx="12" cy="12" rx="10" ry="6" />
          <path d="M8 10h8M8 14h8" />
        </Svg>
      );
    case 'cricket':
      return (
        <Svg className={className}>
          <path d="M5 19L16 8l2 2L7 21z" />
          <circle cx="17" cy="7" r="2" />
        </Svg>
      );
    case 'golf':
      return (
        <Svg className={className}>
          <path d="M12 20V10l6-3-6-3v6" />
          <circle cx="8" cy="19" r="1.5" fill="currentColor" stroke="none" />
        </Svg>
      );
    case 'combat':
      return (
        <Svg className={className}>
          <path d="M8 8l8 8M16 8l-8 8M12 4v4M12 16v4" />
        </Svg>
      );
    case 'darts':
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </Svg>
      );
    case 'cycling':
      return (
        <Svg className={className}>
          <circle cx="7" cy="16" r="3" />
          <circle cx="17" cy="16" r="3" />
          <path d="M10 16l3-8 3 3M13 8l4-2" />
        </Svg>
      );
    case 'racing':
      return (
        <Svg className={className}>
          <path d="M4 14h16l-2 4H6z" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
        </Svg>
      );
    case 'esports':
      return (
        <Svg className={className}>
          <rect x="3" y="6" width="18" height="12" rx="2" />
          <path d="M8 14h8M12 10v4" />
        </Svg>
      );
    case 'table-tennis':
    case 'badminton':
    case 'handball':
    case 'snooker':
    default:
      return (
        <Svg className={className}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v8M8 12h8" />
        </Svg>
      );
  }
}
