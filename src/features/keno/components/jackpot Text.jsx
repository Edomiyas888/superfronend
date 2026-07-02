import React from 'react';
import { styled, keyframes } from '@mui/material/styles';

// 1) Define a keyframe for the pulsing size of the text
const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
`;

// 2) Define a keyframe for the shining effect behind the text.
const shine = keyframes`
  0%, 100% {
    opacity: 0;
  }
  50% {
    opacity: 2;
  }
`;

// 3) Create a styled component for the Bingo Jackpot text.
const BingoJackpotText = styled('h1')(({ theme }) => ({
  //fontFamily: "'Bangers', cursive",
  fontWeight: 'bold',
  fontSize: '0.45rem',  // Adjust size as needed
  color: '#FBC901',
  textAlign: 'center',
  position: 'relative',
  margin: 0,
  animation: `${pulse} 2s infinite`,

  // Use a pseudo-element to create a circular shining background behind the text
  '&::before': {
    content: '""',
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: '120%',    // Covers more space than the text
    height: '120%',   // Covers more space than the text
    transform: 'translate(-50%, -50%)', // Center it behind the text
    borderRadius: '20%',               // Circular borders
    background: `
      transparent
    `,
    animation: `${shine} 2s infinite`,
    zIndex: -1, // Ensure it sits directly behind the text
  },
}));

// 4) Use the styled component in your UI with a line break
export default function BingoJackpot() {
  return (
    <BingoJackpotText sx={{
      backgroundColor:'transparent'
    }}>
      KENO
      <br />
      Leaderboard
    </BingoJackpotText>
  );
}
