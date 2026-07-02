import React, { useState } from 'react';
import { Box, Button } from '@mui/material';
import KenoDrawAnimation from './KenoDrawAnimation';
import NewKenoPlay from './newkenoplay';

const KenoDrawAnimationDemo = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [drawResults, setDrawResults] = useState(null);

  const handleStartDraw = () => {
    setShowAnimation(true);
  };

  const handleDrawComplete = (drawnNumbers) => {
    setDrawResults(drawnNumbers);
    // Wait 2 seconds then return to main game
    setTimeout(() => {
      setShowAnimation(false);
    }, 2000);
  };

  if (showAnimation) {
    return (
      <KenoDrawAnimation 
        drawNumber="197" 
        onComplete={handleDrawComplete}
      />
    );
  }

  return (
    <Box>
      <NewKenoPlay />
      {/* You can add a button to trigger the animation */}
      {/* <Button 
        onClick={handleStartDraw}
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: '#ff9800',
          color: '#fff',
          padding: '12px 24px',
          '&:hover': {
            background: '#f57c00'
          }
        }}
      >
        Start Draw Animation
      </Button> */}
    </Box>
  );
};

export default KenoDrawAnimationDemo;







