import React from 'react';
import KenoDrawAnimation from './KenoDrawAnimation';

const DrawAnimationPage = () => {
  const handleDrawComplete = (drawnNumbers) => {
    console.log('Draw completed! Numbers:', drawnNumbers);
    // Here you can handle what happens after the draw completes
    // For example: navigate back to the main game, show results, etc.
  };

  return (
    <KenoDrawAnimation 
      drawNumber="197" 
      onComplete={handleDrawComplete}
    />
  );
};

export default DrawAnimationPage;







