import React from 'react';
import { Typography } from '@mui/material';

function maskName(name) {
  if (!name) return '';
  if (name.length <= 2) return name;
  return `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(name.length - 1)}`;
}

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
