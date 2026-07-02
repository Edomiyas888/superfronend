import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Close } from '@mui/icons-material';
import odds from '../assets/odds.png';
import { t } from '../utils/translator';
const RulesOverlay = ({ open, handleClose }) => {
  if (!open) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#000', // Black background
        zIndex: 1300, // High z-index to cover the page
        overflowY: 'auto',
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Close button at top-right */}
      <IconButton
        onClick={handleClose}
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#00ff9d', // Green color for close icon
        }}
      >
        <Close />
      </IconButton>
      <Box height={50} />

      <Typography color={'white'} fontSize={'17px'} gutterBottom>
        {t('PAYOUT & WINNINGS')}
      </Typography>
      <Box height={10} />

      <img src={odds} height={220} width={'100%'} />
      <Box height={10} />
      <Typography color={'white'} fontSize={'14px'} gutterBottom>
        {t('Each match combination has a payout multiplier based on how many numbers were picked and')}
        {"\n"}📊 🎲 Keno Payout Table (3% House Edge)
        {"\n"}📌 {t('Example Calculation:')}
        {"\n"}Player Bets 100 ETB and Picks 5 Numbers.
        {"\n"}Player Matches 3 Numbers.
        {"\n"}Odds from Table: 3.2
        {"\n"}Winnings: 100 × 3.2 = 320 ETB
        {"\n"}📌 {t('Max Win:')} 300,000 ETB per bet.
      </Typography>


      <Box sx={{ mt: 8, color: '#fff', whiteSpace: 'pre-line' }}>
        <Typography fontSize={'17px'} gutterBottom>
          {t('ABOUT FAIRNESS')}
        </Typography>
        <Typography fontSize={'14px'} gutterBottom>
          {t('Before each round begins, the game system generates a Hash Code—an encrypted')}
          {t('version of the results for that round. This ensures that the outcome is predetermined')}
          {t('and cannot be changed later. The winning numbers are determined in advance, before any')}
          {t('bets are placed, making the game 100% fair and transparent.')}
        </Typography>

        <Typography fontSize={'17px'} gutterBottom>
          {t('How It Works')}
        </Typography>
        <Typography fontSize={'14px'} gutterBottom>
          {t('Before the round starts, a Hash Code is created and made available.')}
          {t('After the round, players receive a Key and Salt, which can be used to verify that the')}
          {t('results were set before betting.')}
          {"\n"}· {t('Salt is a random sequence of numbers and letters.')}
          {"\n"}· {t('Key is a text combination of four parameters: round id, outcome number, wording,')}
          {t('and a random sequence of numbers and letters.')}
          {"\n"}Players can independently verify the fairness by checking if the Key matches the Hash using
          SHA-512 encryption.
        </Typography>

        <Typography fontSize={'17px'} gutterBottom>
          {t('Example of Fairness Verification')}
          {"\n"}Hash Code (Before Round): 3586ED7EECC3AEA4A6AC4A3...
          {"\n"}Key (After Round): Round ID_Outcome Numbers_Keno_Random Code
          {"\n"}Salt (Verification Key): e20d4c76c654
          {"\n"}By using online hash verification tools, players can confirm that the result was not
          altered after the round began.
        </Typography>

        <Typography fontSize={'17px'} gutterBottom>
          {t('HOW TO PLAY KENO')}
        </Typography>
        <Typography fontSize={'14px'} gutterBottom>
          {t('Keno is a game where you select numbers between 1 and 80 and try to match them with the')}
          20 winning numbers randomly drawn each round.
          {"\n"}🔹 {t('Steps to Play:')}
          {"\n"}• {t('Choose Your Numbers (1 to 10 numbers per bet).')}
          {"\n"}• {t('Set Your Bet Amount (within the min/max limits).')}
          {"\n"}• {t('Click "Bet" to confirm your wager.')}
          {"\n"}The system draws 20 random numbers from 1 to 80.
          {"\n"}Your winnings depend on how many of your chosen numbers match the drawn numbers.
          {"\n"}Players can also delete and change their selected numbers before confirming their bet.
        </Typography>

        <Typography fontSize={'14px'} gutterBottom>
          {t('Hot & Cold Numbers Feature')}
          {"\n"}Hot Numbers (🔴 Red) → Frequently drawn numbers.
          {"\n"}Cold Numbers (🔵 Blue) → Rarely drawn numbers.
          {"\n"}This helps players make informed decisions when selecting numbers.
        </Typography>


        <Typography fontSize={'17px'} gutterBottom>
          {t('GAME RULES & SECURITY')}
        </Typography>
        <Typography fontSize={'14px'} gutterBottom>
          {t('Min Bet:')} 2 ETB | {t('Max Bet:')} 30000
          {"\n"}Max Payout per Bet: 300,000 ETB
          {"\n"}Fairness: Outcomes are pre-generated and provable using the Hash system.
          {"\n"}Real-time Play: Winning numbers are broadcasted instantly.
          {"\n"}Payouts: Automatically credited to the player's balance.
        </Typography>

        <Typography fontSize={'17px'} gutterBottom>
          {t('WHY TRUST OUR KENO GAME?')}
        </Typography>
        <Typography fontSize={'14px'} gutterBottom>
          · 100% Fair – Outcomes are pre-generated and cannot be manipulated
          {"\n"}· Instant Results – No delays, winnings are calculated immediately.
          {"\n"}· Hot & Cold Numbers Feature – Helps players make smarter choices.
          {"\n"}· Verified Security – Results can be independently verified using encryption.
          {"\n"}🎉 {t('Good Luck & Have Fun Playing Keno!')} 🎉
        </Typography>
      </Box>
    </Box>
  );
};

export default RulesOverlay;
