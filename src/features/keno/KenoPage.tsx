import { Stack } from '@mui/material';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/features/keno/contexts/AuthContext';
import Header from '@/features/keno/components/appbar';
import KenoMiniAppBar from '@/features/keno/components/KenoMiniAppBar';
import KenoSplashScreen from '@/features/keno/components/KenoSplashScreen';
import KenoGameDisplay from '@/features/keno/components/KenoGameDisplay';
import { useKenoGameState } from '@/features/keno/hooks/useKenoGameState';
import { useKenoBootReady } from '@/features/keno/hooks/useKenoBootReady';
import './keno-shell.css';

const kenoQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function KenoPageContent() {
  const { loading: authLoading } = useAuth();
  const game = useKenoGameState();
  const gameReady = game.state !== null || !!game.error;
  const bootPhase = useKenoBootReady(authLoading, gameReady);
  const showSplash = bootPhase !== 'done';

  return (
    <Stack
      className="keno-shell"
      sx={{ minHeight: '100vh', width: '100%', maxWidth: '100%', background: '#1b1e1f', position: 'relative' }}
    >
      <div className="desktop_background" aria-hidden="true" />
      <div className="keno-shell__game">
        <KenoMiniAppBar />
        <Header roundNo={game.roundNo} />
        <KenoGameDisplay game={game} />
      </div>
      {showSplash ? <KenoSplashScreen exiting={bootPhase === 'exiting'} /> : null}
    </Stack>
  );
}

export default function KenoPage() {
  return (
    <QueryClientProvider client={kenoQueryClient}>
      <AuthProvider>
        <KenoPageContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}
