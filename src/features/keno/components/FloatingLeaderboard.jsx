import React, { useState, useEffect } from 'react';
import {
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Leaderboard as LeaderboardIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { fetchKenoMonthlyLeaderboard } from '@/features/keno/api/kenoApi';
import PlayerUsername from './fragments/maskPlayerName';

const FloatingLeaderboard = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchKenoMonthlyLeaderboard(100);
      setLeaderboardData(
        data.map((row) => ({
          clientExternalKey: row.userId,
          username: row.username,
          points: row.points,
          rank: row.rank,
        }))
      );
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Error loading leaderboard. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    if (leaderboardData.length === 0) {
      fetchLeaderboard();
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleRefresh = () => {
    fetchLeaderboard();
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return <StarIcon sx={{ color: '#FFD700', fontSize: 20 }} />;
    if (rank === 2) return <StarIcon sx={{ color: '#C0C0C0', fontSize: 20 }} />;
    if (rank === 3) return <StarIcon sx={{ color: '#CD7F32', fontSize: 20 }} />;
    return null;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    if (rank <= 10) return '#4CAF50';
    return '#2196F3';
  };

  return (
    <>
      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="leaderboard"
        className="floating-leaderboard-fab"
        onClick={handleOpen}
      >
        <LeaderboardIcon />
      </Fab>

      {/* Leaderboard Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          className: 'leaderboard-dialog'
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(45deg, #4CAF50 30%, #45a049 90%)',
          color: 'white',
          borderRadius: '12px 12px 0 0'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LeaderboardIcon />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Monthly Leaderboard
            </Typography>
          </Box>
          <Box>
            <IconButton
              onClick={handleRefresh}
              disabled={loading}
              sx={{ color: 'white', mr: 1 }}
            >
              <RefreshIcon />
            </IconButton>
            <IconButton
              onClick={handleClose}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
              flexDirection: 'column',
              gap: 2
            }}>
              <CircularProgress sx={{ color: '#4CAF50' }} />
              <Typography variant="body1" sx={{ color: '#ccc' }}>
                Loading leaderboard...
              </Typography>
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              className="leaderboard-table"
              sx={{
                maxHeight: 500
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(76, 175, 80, 0.1)' }}>
                    <TableCell sx={{
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #4CAF50'
                    }}>
                      Rank
                    </TableCell>
                    <TableCell sx={{
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #4CAF50'
                    }}>
                      Player
                    </TableCell>
                    <TableCell sx={{
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #4CAF50'
                    }}>
                      Points
                    </TableCell>
                    <TableCell sx={{
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #4CAF50'
                    }}>
                      Bets
                    </TableCell>
                    <TableCell sx={{
                      color: '#4CAF50',
                      fontWeight: 'bold',
                      borderBottom: '2px solid #4CAF50'
                    }}>
                      Total Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboardData.map((player, index) => (
                    <TableRow
                      key={player.clientExternalKey}
                      sx={{
                        '&:hover': {
                          background: 'rgba(76, 175, 80, 0.05)'
                        },
                        borderBottom: '1px solid rgba(255,255,255,0.1)'
                      }}
                    >
                      <TableCell sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRankIcon(player.rank)}
                          <Chip
                            label={player.rank}
                            size="small"
                            sx={{
                              background: getRankColor(player.rank),
                              color: 'white',
                              fontWeight: 'bold',
                              minWidth: 30
                            }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>
                        <PlayerUsername label={player.username} clientExternalKey={player.clientExternalKey} />
                      </TableCell>
                      <TableCell sx={{ color: '#4CAF50', fontWeight: 'bold' }}>
                        {player.points.toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: '#ccc' }}>
                        {player.betCount}
                      </TableCell>
                      <TableCell sx={{ color: '#FFD700', fontWeight: 'bold' }}>
                        {player.totalBetAmount.toLocaleString()} birr
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!loading && leaderboardData.length === 0 && !error && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 200,
              flexDirection: 'column',
              gap: 2
            }}>
              <Typography variant="h6" sx={{ color: '#ccc' }}>
                No leaderboard data available
              </Typography>
              <Button
                variant="contained"
                onClick={handleRefresh}
                sx={{
                  background: '#4CAF50',
                  '&:hover': { background: '#45a049' }
                }}
              >
                Refresh
              </Button>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{
          p: 2,
          background: 'rgba(0,0,0,0.2)',
          borderRadius: '0 0 12px 12px'
        }}>
          <Button
            onClick={handleClose}
            sx={{
              color: '#ccc',
              '&:hover': { color: 'white' }
            }}
          >
            Close
          </Button>
          <Button
            onClick={handleRefresh}
            disabled={loading}
            variant="contained"
            sx={{
              background: '#4CAF50',
              '&:hover': { background: '#45a049' }
            }}
          >
            Refresh
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FloatingLeaderboard;
