import { create } from 'zustand';
import { POPULAR_LEAGUE_KEYS } from '../../constants/popularLeagues';

type State = {
  selectedLeague: string;
  setSelectedLeague: (league: string) => void;
};

export const usePopularLeagueFilterStore = create<State>((set) => ({
  selectedLeague: POPULAR_LEAGUE_KEYS[0],
  setSelectedLeague: (league) => set({ selectedLeague: league }),
}));
