import React from 'react';
import { Box, Typography } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/translator';

const WalletDisplay = () => {
  const { currentUser, userBalance } = useAuth();

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(balance);
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <AccountBalanceWalletIcon sx={{ color: '#71cd95', fontSize: '1.2rem' }} />
      <Typography
        variant="body2"
        sx={{
          color: '#71cd95',
          fontWeight: 'bold',
          fontSize: '0.95rem',
        }}
      >
        {formatBalance(userBalance)} {t('Birr')}
      </Typography>
    </Box>
  );
};

export default WalletDisplay;
