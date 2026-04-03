import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import BetslipDrawer from './components/BetslipDrawer';
import SportsHomePage from './pages/SportsHomePage';
import SportMatchesPage from './pages/SportMatchesPage';
import MatchDetailPage from './pages/MatchDetailPage';
import LiveGamesPage from './pages/LiveGamesPage';
import ProfilePage from './pages/ProfilePage';
import AllSportsPage from './pages/AllSportsPage';
import MyBetsPage from './pages/MyBetsPage';
import './App.css';

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<SportsHomePage />} />
          <Route path="sport-new" element={<SportsHomePage />} />
          <Route path="live" element={<LiveGamesPage />} />
          <Route path="sports" element={<AllSportsPage />} />
          <Route path="my-bets" element={<MyBetsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="sport/:sportId" element={<SportMatchesPage />} />
          <Route path="match/:gameId" element={<MatchDetailPage />} />
        </Route>
      </Routes>
      <BetslipDrawer />
    </>
  );
}
