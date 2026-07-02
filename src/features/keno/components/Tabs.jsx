import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, Button, Stack } from '@mui/material';
import { getDatabase, ref, get } from 'firebase/database';
import Person from '@mui/icons-material/Person';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { getQueryParam } from "../utils/url";
// Helper component for tab panels.
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tab-panel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Component that fetches and displays the previous 10 rounds history.
const HistoryTabContent = ({ stake = 10 }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const database = getDatabase();
  const clientKey = localStorage.getItem('clientExternalKey');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // 1) Get the current game number
        const currentGameSnapshot = await get(ref(database, 'BingoGames/currentGame'));
        const currentGame = currentGameSnapshot.val();

        if (!currentGame) {
          setError('No current game found.');
          setLoading(false);
          return;
        }

        // If currentGame = 21, the latest completed round is 20
        const latestRound = currentGame - 1;
        // We want up to 10 previous rounds, but not going below 1
        const earliestRound = Math.max(latestRound - 9, 1);

        // 2) Build an array of rounds in descending order so the newest is first
        const roundsToFetch = [];
        for (let round = latestRound; round >= earliestRound; round--) {
          roundsToFetch.push(round);
        }

        // 3) For each round, see if this user (clientKey) placed a bet
        //    and retrieve the selectedNumbers if they exist
        const historyData = await Promise.all(
          roundsToFetch.map(async (round) => {
            const playerRef = ref(
              database,
              `BingoGames/Game${round}/gameType${stake}/players/${clientKey}`
            );
            const snapshot = await get(playerRef);

            if (snapshot.exists()) {
              const playerData = snapshot.val();
              // Because selectedNumbers is stored as {0: num, 1: num, ...},
              // convert it to an array using Object.values()
              const selectedNumbersObj = playerData.selectedNumbers || {};
              const selectedNumbersArray = Object.values(selectedNumbersObj);
              return {
                round,
                selectedNumbers: selectedNumbersArray,
              };
            } else {
              // No entry for this user on this round
              return {
                round,
                selectedNumbers: [],
              };
            }
          })
        );

        setHistory(historyData);
      } catch (err) {
        setError(err.message);
        const returnUrl = getQueryParam("return-url") || "https://finix.bet/#/returnurl";
        window.location.href = returnUrl;
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [database, stake, clientKey]);

  if (loading) {
    return <Typography>Loading history...</Typography>;
  }

  if (error) {
    return <Typography color="red">Error: {error}</Typography>;
  }

  return (
    <Box>

      <table style={{ width: '100%', borderCollapse: 'collapse', color: '#00ff9d' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid white', padding: '8px' }}>Round</th>
            <th style={{ border: '1px solid white', padding: '8px' }}>Selected Cartelas</th>
          </tr>
        </thead>
        <tbody>
          {history.map((roundData) => (
            <tr key={roundData.round}>
              <td style={{ border: '1px solid white', padding: '8px' }}>
                Game #{roundData.round}
              </td>
              <td style={{ border: '1px solid white', padding: '8px' }}>
                {roundData.selectedNumbers && roundData.selectedNumbers.length > 0
                  ? roundData.selectedNumbers.join(', ')
                  : 'No bet placed'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

const ResultsTabContent = ({ stake = 10 }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const database = getDatabase();

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // 1) Get the current game number
        const currentGameSnap = await get(ref(database, 'BingoGames/currentGame'));
        const currentGame = currentGameSnap.val();

        if (!currentGame) {
          setError('No current game found.');
          setLoading(false);
          return;
        }

        // 2) Build an array of the last 20 game rounds in descending order
        //    so the newest is at the top
        const latestRound = currentGame - 1;       // e.g. if currentGame=21, the latest completed is 20
        const earliestRound = Math.max(latestRound - 19, 1); // e.g. get up to 20 rounds, down to 1
        const roundsToFetch = [];
        for (let round = latestRound; round >= earliestRound; round--) {
          roundsToFetch.push(round);
        }

        // 3) For each round, fetch the winners from
        //    BingoGames/Game${round}/gameType${stake}/winners
        const resultsData = await Promise.all(
          roundsToFetch.map(async (round) => {
            const winnersRef = ref(database, `BingoGames/Game${round}/gameType${stake}/winners`);
            const winnersSnap = await get(winnersRef);

            if (winnersSnap.exists()) {
              // winnersSnap might look like:
              // { 0: { boardKey: "card44", clientKey: "...", token: "..." }, 1: {...}, ... }
              const winnersObj = winnersSnap.val();
              const winnersArray = Object.values(winnersObj).map((item) => ({
                boardKey: item.boardKey || 'N/A',
                clientKey: item.clientKey || 'N/A',
              }));
              return { round, winners: winnersArray };
            } else {
              // No winners for this round
              return { round, winners: [] };
            }
          })
        );

        setResults(resultsData);
      } catch (err) {
        setError(err.message);
        const returnUrl = getQueryParam("return-url") || "https://finix.bet/#/returnurl";
        window.location.href = returnUrl;
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [database, stake]);

  if (loading) {
    return <Typography>Loading results...</Typography>;
  }

  if (error) {
    return <Typography color="red">Error: {error}</Typography>;
  }

  return (
    <Box>

      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #00ff9d', padding: '8px' }}>Round</th>
            <th style={{ border: '1px solid #00ff9d', padding: '8px' }}>Winning Cartelas</th>
          </tr>
        </thead>
        <tbody>
          {results.map((roundData) => (
            <tr key={roundData.round}>
              <td style={{ border: '1px solid #00ff9d', padding: '8px' }}>
                Game #{roundData.round}
              </td>
              <td style={{ border: '1px solid #00ff9d', padding: '8px' }}>
                {roundData.winners && roundData.winners.length > 0 ? (
                  roundData.winners
                    .map((winner) => winner.boardKey)
                    .join(', ')
                ) : (
                  'No winners'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

// Component that displays the Game and History tabs.
const GameHistoryTabs = ({
  prize,
  currentGame,
  totalSelectedCount,
  t,
  selfClient,
  otherPlayers,
  calledNumbers,
  cards,
  setInputNumber,
  secondDialogOpen,
  setSecondDialogOpen,
  unlockAllNumbers,
  SelectedDialogsScroll1,
  SelectedDialogsScroll,
  PlayerUsername,
  stake  // Stake should be passed as a prop
}) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Game and History Tabs" TabIndicatorProps={{ style: { backgroundColor: "#00ff9d" } }}>
        <Tab
          icon={<SportsEsportsIcon />}
          label="Game"
          iconPosition="start"
          sx={{
            color: '#00ff9d',
            '&.Mui-selected': { color: '#00ff9d' }
          }} id="tab-0"

          aria-controls="tab-panel-0"
        />
        <Tab
          icon={<HistoryIcon />}
          label="History"
          iconPosition="start"
          sx={{
            color: '#00ff9d',
            '&.Mui-selected': { color: '#00ff9d' }
          }} id="tab-1"
          aria-controls="tab-panel-1"
        />
        <Tab
          icon={<AssessmentIcon />}
          label="Results"
          iconPosition="start"
          sx={{
            color: '#00ff9d',
            '&.Mui-selected': { color: '#00ff9d' }
          }} id="tab-2"
          aria-controls="tab-panel-2"
        />

      </Tabs>

      {/* Game Tab */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ background: 'linear-gradient(200deg, #212f29 50%, #212f29 90%)' }}>
          <Stack direction="row" justifyContent="space-between" padding={1}>
            <Typography color="#59c789" fontSize="13px">
              {t("Prize")}: {prize ?? 0} {t("ETB")}
            </Typography>
            <Typography color="#59c789" fontSize="13px">
              {t("Game")} #{currentGame}
            </Typography>
            <Button sx={{ height: '10px', color: '#59c789', paddingTop: 1.5 }}>
              <Person />:
              <Typography variant="h6">{totalSelectedCount}</Typography>
            </Button>
          </Stack>
        </Box>

        {/* Display current player's selected dialogs */}
        {otherPlayers.length ? (
          otherPlayers
            .filter((item) => item.clientExternalKey === selfClient)
            .map((player) => (
              <Box key={player.clientKey} sx={{ my: 1 }}>
                <SelectedDialogsScroll1
                  selectedNumbers={player.selectedNumbers}
                  calledNumbers={calledNumbers}
                  cards={cards}
                  setInputNumber={setInputNumber}
                  secondDialogOpen={secondDialogOpen}
                  setSecondDialogOpen={setSecondDialogOpen}
                  unlockAllNumbers={unlockAllNumbers}
                />
              </Box>
            ))
        ) : (
          <Typography variant="body1" color="white"></Typography>
        )}

        {/* Display other players' data */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" color="white">
            Other Players:
          </Typography>
          {otherPlayers.length ? (
            otherPlayers
              .filter((item) => item.clientExternalKey !== selfClient)
              .map((player) => (
                <Box key={player.clientKey} sx={{ my: 1 }}>
                  <PlayerUsername clientExternalKey={player.clientExternalKey} />
                  <SelectedDialogsScroll
                    selectedNumbers={player.selectedNumbers}
                    calledNumbers={calledNumbers}
                    cards={cards}
                    setInputNumber={setInputNumber}
                    secondDialogOpen={secondDialogOpen}
                    setSecondDialogOpen={setSecondDialogOpen}
                    unlockAllNumbers={unlockAllNumbers}
                  />
                </Box>
              ))
          ) : (
            <Typography variant="body1" color="white">
              No other players found.
            </Typography>
          )}
        </Box>
      </TabPanel>

      {/* History Tab */}
      <TabPanel value={tabValue} index={1}>
        <HistoryTabContent stake={stake} />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <ResultsTabContent stake={stake} />
      </TabPanel>
    </Box>
  );
};

export default GameHistoryTabs;
