import React from 'react';
import { Typography, Tabs, Tab, Stack } from '@mui/material';
import PlayerUsername from '../components/fragments/maskPlayerName'; // adjust path as necessary

const WinnersTabContent = ({ winnersSubTab, setWinnersSubTab, winnersMonthly }) => {
  // Determine which winners list to display.
  // For now, we only use winnersMonthly when winnersSubTab is 0.
  let winnersToDisplay = [];
  if (winnersSubTab === 0) winnersToDisplay = winnersMonthly;
  
  // Sort winners in descending order by totalWin.
  winnersToDisplay = winnersToDisplay.sort(
    (a, b) => Number(b.totalWin) - Number(a.totalWin)
  );

  return (
    <div style={{ padding: '20px' }}>
      {/* Sub-tabs for Today, Weekly, and Monthly (only Monthly is active here) */}
      <Tabs
        value={winnersSubTab}
        onChange={(e, newVal) => {
          setWinnersSubTab(newVal);
        }}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ marginBottom: '20px' }}
        TabIndicatorProps={{ style: { backgroundColor: "#00ff9d" } }}
      >
        {/*
        Uncomment the tabs below if you want to add more winners categories.
        <Tab label="Today" sx={{ color: '#00ff9d', '&.Mui-selected': { color: '#00ff9d' } }} />
        <Tab label="Weekly" sx={{ color: '#00ff9d', '&.Mui-selected': { color: '#00ff9d' } }} />
        */}
        <Tab label="Monthly" sx={{ color: '#00ff9d', '&.Mui-selected': { color: '#00ff9d' } }} />
      </Tabs>

      {winnersToDisplay.length > 0 ? (
        winnersToDisplay.map((winner, index) => (
          <Stack
            key={index}
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
              backgroundColor: '#283134',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
              <Typography color="white" fontWeight="bold">
                {index + 1}.
              </Typography>
              <PlayerUsername clientExternalKey={winner.userId} />
            </div>
            <Typography color="#efcf37" fontWeight="bold">
              Won {Number(winner.totalWin).toFixed(2)} ETB
            </Typography>
          </Stack>
        ))
      ) : (
        <Typography color="white">No winners available.</Typography>
      )}
    </div>
  );
};

export default WinnersTabContent;
