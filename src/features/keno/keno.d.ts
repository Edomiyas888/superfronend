declare module '@/features/keno/contexts/AuthContext' {
  import type { ReactNode } from 'react';
  export function useAuth(): {
    currentUser: { uid: string; email?: string; displayName?: string } | null;
    userBalance: number;
    signup: (email: string, password: string, displayName?: string) => Promise<unknown>;
    login: (email: string, password: string) => Promise<unknown>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    loading: boolean;
  };
  export function AuthProvider(props: { children: ReactNode }): JSX.Element;
}

declare module '@/features/keno/components/appbar' {
  const Header: (props: { roundNo?: number | null }) => JSX.Element;
  export default Header;
}

declare module '@/features/keno/components/KenoGameDisplay' {
  import type { KenoPublicState } from '@/features/keno/api/kenoApi';

  type KenoGameState = {
    state: KenoPublicState | null;
    error: string | null;
    roundNo: number | null;
    countdown: number;
    calledNumbers: number[];
    allBets: KenoPublicState['allBets'];
    selfBets: KenoPublicState['allBets'];
    otherBets: KenoPublicState['allBets'];
    fakePlayers: KenoPublicState['allBets'];
    roundsData: KenoPublicState['roundsHistory'];
    simulatedCount: number;
    displayedTotalPlayers: number;
    userId: string | null;
  };

  const KenoGameDisplay: (props: { game: KenoGameState }) => JSX.Element;
  export default KenoGameDisplay;
}

declare module '@/features/keno/components/FloatingLeaderboard' {
  const FloatingLeaderboard: () => JSX.Element;
  export default FloatingLeaderboard;
}

declare module '@/features/keno/**/*.js' {
  const mod: unknown;
  export default mod;
}

declare module '@/features/keno/**/*.jsx' {
  const mod: unknown;
  export default mod;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.mp4' {
  const src: string;
  export default src;
}
