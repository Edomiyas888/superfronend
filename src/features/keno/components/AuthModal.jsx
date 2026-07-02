import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../utils/translator';

const AuthModal = ({ open, onClose }) => {
  const [tab, setTab] = useState(0); // 0 = login, 1 = signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const { signup, login, resetPassword } = useAuth();

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    setError('');
    setResetMode(false);
    setResetSuccess(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError(t('Please fill in all fields'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      onClose();
    } catch (err) {
      setError(t('Failed to login') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password || !displayName) {
      setError(t('Please fill in all fields'));
      return;
    }

    if (password.length < 6) {
      setError(t('Password must be at least 6 characters'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('Passwords do not match'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password, displayName);
      onClose();
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError(t('Email already in use'));
      } else if (err.code === 'auth/weak-password') {
        setError(t('Password is too weak'));
      } else {
        setError(t('Failed to create account') + ': ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!email) {
      setError(t('Please enter your email'));
      return;
    }

    try {
      setError('');
      setLoading(true);
      await resetPassword(email);
      setResetSuccess(true);
    } catch (err) {
      setError(t('Failed to send reset email') + ': ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: '#1b1e1f',
          border: '1px solid #71cd95',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle sx={{ color: '#71cd95', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">{t('Account')}</Typography>
        <IconButton onClick={onClose} sx={{ color: '#71cd95' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {!resetMode ? (
          <>
            <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
              <Tab label={t('Login')} sx={{ color: '#71cd95' }} />
              <Tab label={t('Sign Up')} sx={{ color: '#71cd95' }} />
            </Tabs>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {tab === 0 ? (
              <Box component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label={t('Email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <TextField
                  fullWidth
                  label={t('Password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: '#71cd95',
                    color: '#000',
                    mb: 1,
                    '&:hover': { background: '#5fb87d' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : t('Login')}
                </Button>
                <Button
                  fullWidth
                  onClick={() => setResetMode(true)}
                  sx={{ color: '#71cd95' }}
                >
                  {t('Forgot Password?')}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSignup}>
                <TextField
                  fullWidth
                  label={t('Display Name')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <TextField
                  fullWidth
                  label={t('Email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <TextField
                  fullWidth
                  label={t('Password')}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <TextField
                  fullWidth
                  label={t('Confirm Password')}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: '#71cd95',
                    color: '#000',
                    '&:hover': { background: '#5fb87d' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : t('Sign Up')}
                </Button>
                
              </Box>
            )}
          </>
        ) : (
          <Box component="form" onSubmit={handleResetPassword}>
            {resetSuccess ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                {t('Password reset email sent! Check your inbox.')}
              </Alert>
            ) : (
              <>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <Typography sx={{ color: '#71cd95', mb: 2 }}>
                  {t('Enter your email to receive a password reset link')}
                </Typography>
                <TextField
                  fullWidth
                  label={t('Email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{ style: { color: '#fff' } }}
                  InputLabelProps={{ style: { color: '#71cd95' } }}
                />
                <Button
                  fullWidth
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  sx={{
                    background: '#71cd95',
                    color: '#000',
                    mb: 1,
                    '&:hover': { background: '#5fb87d' }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : t('Send Reset Link')}
                </Button>
              </>
            )}
            <Button
              fullWidth
              onClick={() => {
                setResetMode(false);
                setResetSuccess(false);
                setError('');
              }}
              sx={{ color: '#71cd95' }}
            >
              {t('Back to Login')}
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

