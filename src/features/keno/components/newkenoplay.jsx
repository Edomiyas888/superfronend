import React, { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Paper,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import RefreshIcon from '@mui/icons-material/Refresh';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloseIcon from '@mui/icons-material/Close';
import './newkenoplay.css';

const NewKenoPlay = ({ countdown = 50, roundNo = '80443', onPlaceBet, placedBets = [], calledNumbers = [], balance = 0, userId }) => {
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [betslipTab, setBetslipTab] = useState(0);
  const [mainTab, setMainTab] = useState(0);
  const maxSelections = 20;
  
  // Format balance for display
  const formattedBalance = typeof balance === 'number' 
    ? balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';

  // Generate numbers 1-80
  const numbers = Array.from({ length: 80 }, (_, i) => i + 1);

  const handleNumberClick = (number) => {
    if (selectedNumbers.includes(number)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== number));
    } else {
      if (selectedNumbers.length < maxSelections) {
        setSelectedNumbers([...selectedNumbers, number]);
      }
    }
  };

  const handleClear = () => {
    setSelectedNumbers([]);
  };

  const handlePlaceBet = () => {
    if (selectedNumbers.length === 0) return;
    
    const bet = {
      selectedNumbers: [...selectedNumbers],
      betAmount: totalBetAmount,
      timestamp: Date.now()
    };
    
    // Call parent callback to place bet
    if (onPlaceBet) {
      onPlaceBet(bet);
    }
    
    console.log('Placing bet with numbers:', selectedNumbers);
    // Don't clear selected numbers - keep them for the user to see
  };

  const totalBetAmount = selectedNumbers.length > 0 ? selectedNumbers.length * 10 : 0;

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: '#1b1e1f',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Bar */}
  

      {/* Tabs below top bar */}
      <Box sx={{ padding: '0 20px', background: '#1b1e1f' }}>
        <Tabs
          value={mainTab}
          onChange={(e, newValue) => setMainTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: '#fff',
              textTransform: 'none',
              fontWeight: 'bold',
              minWidth: '120px',
              '&.Mui-selected': {
                color: '#ff9800',
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#ff9800',
            }
          }}
        >
          <Tab label="Betslip" />
          <Tab label="My Bets" />
        </Tabs>
      </Box>
<Box>this is a test</Box>
      {/* Main Content Area */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side - Game Area */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          background: '#1b1e1f',
          padding: '20px'
        }}>
          {/* Draw Information */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ marginBottom: '20px' }}>
            <Typography sx={{ 
              color: '#fff', 
              fontSize: '18px', 
              fontWeight: 'bold'
            }}>
              DRAW {roundNo}
            </Typography>
            <Box sx={{
              background: countdown <= 10 ? '#d32f2f' : '#4caf50',
              padding: '8px 16px',
              borderRadius: '8px',
              animation: countdown <= 10 ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.7 }
              }
            }}>
              <Typography sx={{ 
                color: '#fff', 
                fontSize: '24px', 
                fontWeight: 'bold'
              }}>
                {String(Math.floor(countdown / 60)).padStart(2, '0')}:{String(countdown % 60).padStart(2, '0')}
              </Typography>
            </Box>
          </Stack>

          {/* Main Game Container with Red Background */}
          <Box sx={{
            background: 'linear-gradient(180deg, #c62828 0%, #b71c1c 100%)',
            borderRadius: '0',
            padding: '20px',
            position: 'relative',
            minHeight: '550px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            {/* Selected Count Display */}
            <Box sx={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '8px 16px',
              borderRadius: '4px',
              border: '2px solid #ffeb3b'
            }}>
              <Typography sx={{
                color: '#ffeb3b',
                fontSize: '28px',
                fontWeight: 'bold',
                lineHeight: 1
              }}>
                {selectedNumbers.length} / {maxSelections}
              </Typography>
            </Box>

            {/* Number Grid */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(10, 1fr)',
              gap: '6px',
              width: '100%',
              maxWidth: '650px',
              marginTop: '20px'
            }}>
              {numbers.map((number) => {
                const isSelected = selectedNumbers.includes(number);
                const isDrawn = calledNumbers.includes(number);
                return (
                  <Button
                    key={number}
                    onClick={() => handleNumberClick(number)}
                    sx={{
                      minWidth: '45px',
                      height: '45px',
                      padding: 0,
                      background: isSelected 
                        ? '#ffeb3b' 
                        : isDrawn 
                        ? '#00bcd4' 
                        : 'rgba(0, 0, 0, 0.3)',
                      color: isSelected || isDrawn ? '#000' : '#fff',
                      border: isSelected 
                        ? '3px solid #fbc02d' 
                        : isDrawn 
                        ? '3px solid #00acc1' 
                        : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      transition: 'all 0.2s',
                      '&:hover': {
                        background: isSelected 
                          ? '#fbc02d' 
                          : isDrawn 
                          ? '#00acc1' 
                          : 'rgba(255, 255, 255, 0.15)',
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    {number}
                  </Button>
                );
              })}
            </Box>

            {/* KENO Logo */}
            <Box sx={{
              position: 'absolute',
              bottom: '20px',
              left: '20px'
            }}>
              <Typography sx={{
                fontSize: '56px',
                fontWeight: 'bold',
                color: 'rgba(255, 235, 59, 0.4)',
                fontFamily: 'Arial Black, Arial, sans-serif',
                textShadow: '3px 3px 6px rgba(0, 0, 0, 0.5)',
                letterSpacing: '2px'
              }}>
                KENO
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Side - Betslip */}
        {mainTab === 0 && (
          <Box sx={{
            width: '350px',
            background: '#2a2d2e',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            {/* Betslip Sub-tabs */}
            <Box sx={{ padding: '10px' }}>
              <Stack direction="row" spacing={1}>
                <Button
                  onClick={() => setBetslipTab(0)}
                  sx={{
                    flex: 1,
                    background: betslipTab === 0 ? '#ff9800' : 'transparent',
                    color: betslipTab === 0 ? '#fff' : '#ff9800',
                    border: betslipTab === 0 ? 'none' : '1px solid #ff9800',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: betslipTab === 0 ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                    }
                  }}
                >
                  SINGLE
                </Button>
                <Button
                  onClick={() => setBetslipTab(1)}
                  sx={{
                    flex: 1,
                    background: betslipTab === 1 ? '#ff9800' : 'transparent',
                    color: betslipTab === 1 ? '#fff' : '#ff9800',
                    border: betslipTab === 1 ? 'none' : '1px solid #ff9800',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: betslipTab === 1 ? '#f57c00' : 'rgba(255, 152, 0, 0.1)',
                    }
                  }}
                >
                  MULTIPLES
                </Button>
              </Stack>
            </Box>

            {/* Betslip Content */}
            <Box sx={{ 
              flex: 1, 
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <Box>
                <Typography sx={{ 
                  color: '#fff', 
                  fontSize: '14px',
                  marginBottom: '10px'
                }}>
                  Current Selection
                </Typography>

                {selectedNumbers.length > 0 && (
                  <Paper sx={{
                    background: 'rgba(255, 152, 0, 0.1)',
                    padding: '10px',
                    marginBottom: '10px',
                    border: '1px solid rgba(255, 152, 0, 0.3)'
                  }}>
                    <Typography sx={{ color: '#ff9800', fontSize: '12px', marginBottom: '5px', fontWeight: 'bold' }}>
                      Selected: {selectedNumbers.length} numbers
                    </Typography>
                    <Typography sx={{ color: '#fff', fontSize: '12px' }}>
                      Bet Amount: €{totalBetAmount.toFixed(2)}
                    </Typography>
                  </Paper>
                )}

                {placedBets.length > 0 && (
                  <>
                    <Typography sx={{ 
                      color: '#4caf50', 
                      fontSize: '14px',
                      marginTop: '20px',
                      marginBottom: '10px',
                      fontWeight: 'bold'
                    }}>
                      Active Bets ({placedBets.length})
                    </Typography>
                    <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {placedBets.map((bet, index) => (
                        <Paper key={index} sx={{
                          background: 'rgba(76, 175, 80, 0.1)',
                          padding: '8px',
                          marginBottom: '8px',
                          border: '1px solid rgba(76, 175, 80, 0.3)'
                        }}>
                          <Typography sx={{ color: '#4caf50', fontSize: '11px', marginBottom: '3px' }}>
                            Bet #{index + 1} - {bet.selectedNumbers.length} numbers
                          </Typography>
                          <Typography sx={{ color: '#fff', fontSize: '10px' }}>
                            Amount: €{bet.betAmount.toFixed(2)}
                          </Typography>
                          <Typography sx={{ color: '#999', fontSize: '9px' }}>
                            Numbers: {bet.selectedNumbers.sort((a, b) => a - b).join(', ')}
                          </Typography>
                        </Paper>
                      ))}
                    </Box>
                  </>
                )}
              </Box>

              {/* Action Buttons */}
              <Stack spacing={2}>
                <Button
                  onClick={handleClear}
                  fullWidth
                  sx={{
                    background: '#424242',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    padding: '14px',
                    fontSize: '16px',
                    '&:hover': {
                      background: '#616161',
                    }
                  }}
                >
                  CLEAR
                </Button>
                <Button
                  onClick={handlePlaceBet}
                  fullWidth
                  disabled={selectedNumbers.length === 0}
                  sx={{
                    background: selectedNumbers.length > 0 ? '#4caf50' : '#555',
                    color: '#fff',
                    textTransform: 'none',
                    fontWeight: 'bold',
                    padding: '14px',
                    fontSize: '16px',
                    '&:hover': {
                      background: selectedNumbers.length > 0 ? '#388e3c' : '#555',
                    },
                    '&:disabled': {
                      background: '#555',
                      color: '#999',
                    }
                  }}
                >
                  PLACE BET {selectedNumbers.length === 0 ? '0' : totalBetAmount}
                </Button>
              </Stack>
            </Box>
          </Box>
        )}

        {/* My Bets Tab Content */}
        {mainTab === 1 && (
          <Box sx={{
            width: '350px',
            background: '#2a2d2e',
            padding: '20px',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <Typography sx={{ color: '#fff', fontSize: '16px', fontWeight: 'bold' }}>
              My Bets
            </Typography>
            <Typography sx={{ color: '#999', fontSize: '14px', marginTop: '20px' }}>
              No bets placed yet
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default NewKenoPlay;

