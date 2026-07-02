import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

const KenoDrawAnimation = ({ drawNumber, calledNumbers = [], onComplete }) => {
  const [currentBall, setCurrentBall] = useState(null);
  const [headsNumber, setHeadsNumber] = useState(null);
  
  // Generate all numbers 1-80 for the grid
  const allNumbers = Array.from({ length: 80 }, (_, i) => i + 1);

  // Use calledNumbers from Firebase
  const drawnNumbers = calledNumbers;

  // Track the current ball being shown
  useEffect(() => {
    if (calledNumbers.length > 0) {
      const latestNumber = calledNumbers[calledNumbers.length - 1];
      setCurrentBall(latestNumber);
      
      // Update heads number occasionally
      if (calledNumbers.length % 3 === 0) {
        setHeadsNumber(latestNumber);
      }
    }
  }, [calledNumbers]);

  // Check if drawing is complete (20 numbers drawn)
  useEffect(() => {
    if (calledNumbers.length === 20 && onComplete) {
      setTimeout(() => {
        onComplete(calledNumbers);
      }, 2000);
    }
  }, [calledNumbers, onComplete]);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #d32f2f 0%, #b71c1c 100%)',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Left Side - Numbers Grid Display */}
      <Box sx={{
        flex: 1,
        position: 'relative',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Top Section - Draw Number and HEADS */}
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '20px',
          position: 'relative',
          zIndex: 10
        }}>
          {/* Draw Number with smaller number below */}
          <Box>
            <Typography sx={{
              color: '#ffeb3b',
              fontSize: '48px',
              fontWeight: 'bold',
              textShadow: '3px 3px 6px rgba(0, 0, 0, 0.7)',
              lineHeight: 1,
              marginBottom: '5px'
            }}>
              DRAW {drawNumber}
            </Typography>
            {headsNumber && (
              <Box sx={{
                background: '#ffeb3b',
                borderRadius: '8px',
                padding: '8px 16px',
                display: 'inline-block',
                marginTop: '12px'
              }}>
                <Typography sx={{
                  color: '#000',
                  fontSize: '36px',
                  fontWeight: 'bold',
                  lineHeight: 1
                }}>
                  {headsNumber}
                </Typography>
              </Box>
            )}
          </Box>

          {/* HEADS Button */}
          <Button
            sx={{
              background: '#ffeb3b',
              color: '#000',
              fontWeight: 'bold',
              padding: '10px 32px',
              fontSize: '20px',
              borderRadius: '24px',
              textTransform: 'none',
              marginTop: '5px',
              '&:hover': {
                background: '#fdd835',
              }
            }}
          >
            HEADS
          </Button>
        </Box>

        {/* Number Grid - All 80 numbers */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '8px',
          width: '95%',
          maxWidth: '750px',
          margin: '0 auto',
          padding: '10px 20px',
          flex: 1,
          alignContent: 'center'
        }}>
          {allNumbers.map((number) => {
            const isDrawn = drawnNumbers.includes(number);
            const isCurrentBall = number === currentBall;
            return (
              <Box
                key={number}
                sx={{
                  minWidth: '55px',
                  height: '55px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isDrawn ? '#ffeb3b' : 'rgba(0, 0, 0, 0.5)',
                  color: isDrawn ? '#000' : 'rgba(255, 255, 255, 0.25)',
                  border: isDrawn ? '3px solid #fbc02d' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '22px',
                  transition: 'all 0.3s ease',
                  animation: isCurrentBall && isDrawn ? 'highlight 0.5s ease-in' : 'none',
                  transform: isCurrentBall && isDrawn ? 'scale(1.1)' : 'scale(1)',
                  boxShadow: isDrawn ? '0 2px 8px rgba(255, 235, 59, 0.5)' : 'none',
                  '@keyframes highlight': {
                    '0%': { transform: 'scale(1)', background: 'rgba(0, 0, 0, 0.5)' },
                    '50%': { transform: 'scale(1.3)', background: '#ffeb3b', boxShadow: '0 4px 16px rgba(255, 235, 59, 0.8)' },
                    '100%': { transform: 'scale(1)', background: '#ffeb3b', boxShadow: '0 2px 8px rgba(255, 235, 59, 0.5)' }
                  }
                }}
              >
                <Typography sx={{
                  fontSize: '22px',
                  fontWeight: 'bold',
                  lineHeight: 1,
                  color: 'inherit'
                }}>
                  {number}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* KENO Logo */}
        <Typography sx={{
          position: 'absolute',
          bottom: '20px',
          left: '30px',
          fontSize: '72px',
          fontWeight: 'bold',
          color: 'rgba(255, 235, 59, 0.4)',
          fontFamily: 'Arial Black, Arial, sans-serif',
          textShadow: '4px 4px 8px rgba(0, 0, 0, 0.5)',
          letterSpacing: '6px',
          zIndex: 1
        }}>
          KENO
        </Typography>
      </Box>

      {/* Right Side - Ball Machine */}
      <Box sx={{
        width: '40%',
        minWidth: '450px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Progress Counter */}
        <Box sx={{
          position: 'absolute',
          top: '30px',
          right: '30px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '14px 24px',
          borderRadius: '10px',
          border: '3px solid #fff'
        }}>
          <Typography sx={{
            color: '#fff',
            fontSize: '42px',
            fontWeight: 'bold',
            lineHeight: 1
          }}>
            {drawnNumbers.length}<Typography component="span" sx={{ fontSize: '28px' }}>/20</Typography>
          </Typography>
        </Box>

        {/* Ball Machine Container */}
        <Box sx={{
          position: 'relative',
          width: '450px',
          height: '550px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* Top Metal Cap */}
          <Box sx={{
            position: 'absolute',
            top: '0',
            width: '360px',
            height: '90px',
            background: 'linear-gradient(180deg, #616161 0%, #424242 50%, #212121 100%)',
            borderRadius: '40px 40px 0 0',
            border: '4px solid #9e9e9e',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.5)',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100px',
              height: '40px',
              background: 'linear-gradient(180deg, #757575 0%, #424242 100%)',
              borderRadius: '20px 20px 0 0',
              border: '3px solid #9e9e9e'
            }
          }} />

          {/* Glass Cylinder */}
          <Box sx={{
            position: 'absolute',
            top: '80px',
            width: '360px',
            height: '340px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '6px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '180px',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 50px rgba(0, 0, 0, 0.3)',
            overflow: 'hidden'
          }}>
            {/* Current Ball */}
            {currentBall && (
              <Box sx={{
                width: '230px',
                height: '230px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffeb3b 0%, #fdd835 50%, #f9a825 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.7), inset -8px -8px 25px rgba(0, 0, 0, 0.3)',
                border: '6px solid rgba(255, 255, 255, 0.6)',
                position: 'relative',
                animation: 'ballBounce 1s ease-in-out',
                '@keyframes ballBounce': {
                  '0%': { transform: 'translateY(-50px) scale(0.8)', opacity: 0 },
                  '50%': { transform: 'translateY(10px) scale(1.05)' },
                  '100%': { transform: 'translateY(0) scale(1)', opacity: 1 }
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: '35px',
                  left: '45px',
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.4)',
                  filter: 'blur(15px)',
                }
              }}>
                <Typography sx={{
                  fontSize: '90px',
                  fontWeight: 'bold',
                  color: '#000',
                  textShadow: '3px 3px 6px rgba(0, 0, 0, 0.3)',
                }}>
                  {currentBall}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Bottom Metal Cap */}
          <Box sx={{
            position: 'absolute',
            bottom: '0',
            width: '360px',
            height: '90px',
            background: 'linear-gradient(0deg, #616161 0%, #424242 50%, #212121 100%)',
            borderRadius: '0 0 45px 45px',
            border: '4px solid #9e9e9e',
            boxShadow: '0 -4px 10px rgba(0, 0, 0, 0.5)',
          }} />
        </Box>

        {/* TAILS Button */}
        <Button
          sx={{
            position: 'absolute',
            bottom: '60px',
            background: '#ff9800',
            color: '#fff',
            fontWeight: 'bold',
            padding: '12px 40px',
            fontSize: '20px',
            borderRadius: '28px',
            textTransform: 'none',
            '&:hover': {
              background: '#f57c00',
            }
          }}
        >
          TAILS
        </Button>
      </Box>
    </Box>
  );
};

export default KenoDrawAnimation;

