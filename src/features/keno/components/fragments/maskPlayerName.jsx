import React from 'react';
import { Typography } from '@mui/material';

function maskName(name) {
  if (!name) return '';
  if (name.length <= 4) return name;
  return `${name.charAt(0)}${'*'.repeat(name.length - 4)}${name.slice(-3)}`;
}

export { maskName };

/** Display a masked player label (username string from SuperBet API). */
const PlayerUsername = ({ clientExternalKey, label }) => {
  const display = label ?? clientExternalKey ?? '';
  return (
    <Typography sx={{ color: '#4ca46a', fontWeight: 'bold' }}>
      {maskName(display)}
    </Typography>
  );
};

export default PlayerUsername;
