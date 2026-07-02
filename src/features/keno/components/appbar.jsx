import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import Typography from "@mui/material/Typography";
import Logo from "../assets/fastloader.png";
import RulesOverlay from './riles';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Select, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { t, getCurrentLanguage, setCurrentLanguage } from '../utils/translator';
import { useAuth } from '../contexts/AuthContext';
import './keno-header.css';
import './font.css';

function formatBalance(balance) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(balance);
}

const StatusPill = ({
  currentUser,
  userBalance,
  roundNo,
  onRulesClick,
  onLoginClick,
  isDesktop,
}) => {
  if (!currentUser) {
    return (
      <button type="button" className="keno-header__login-text keno-header__login-text--full" onClick={onLoginClick}>
        {t('Please login to play')}
      </button>
    );
  }

  return (
    <>
      <Box className="keno-header__pill-left">
        {isDesktop ? (
          <>
            <Box className="keno-header__user-chip">
              <PersonIcon sx={{ color: '#71cd95', fontSize: '0.9rem' }} />
              <Typography
                variant="body2"
                sx={{ color: '#71cd95', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}
              >
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </Typography>
            </Box>
            <span className="keno-header__divider" aria-hidden="true" />
          </>
        ) : null}
        <Box className="keno-header__balance">
          <span className="keno-header__balance-amount">{formatBalance(userBalance)}</span>
          <span className="keno-header__balance-currency">ETB</span>
        </Box>
      </Box>

      <span className="keno-header__pill-split" aria-hidden="true" />

      <Box className="keno-header__pill-right">
        {roundNo ? (
          <button type="button" className="keno-header__game-id-inline" onClick={onRulesClick}>
            <span>ID: {roundNo}</span>
            <VerifiedUserIcon className="keno-header__verified" fontSize="inherit" />
          </button>
        ) : null}
      </Box>
    </>
  );
};

const Header = ({ roundNo = null }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [lang, setLang] = useState(getCurrentLanguage());
  const { currentUser, userBalance, logout } = useAuth();

  useEffect(() => {
    const onOpenRules = () => setOverlayOpen(true);
    window.addEventListener('keno:open-rules', onOpenRules);
    return () => window.removeEventListener('keno:open-rules', onOpenRules);
  }, []);

  const handleOpenOverlay = () => setOverlayOpen(true);
  const handleCloseOverlay = () => setOverlayOpen(false);

  const handleLangChange = (event) => {
    setLang(event.target.value);
    setCurrentLanguage(event.target.value);
    window.location.reload();
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const languageOptions = [
    { code: 'en', label: 'EN' },
    { code: 'am', label: 'AM' },
  ];

  return (
    <>
      <AppBar position="static" className="keno-header">
        <Toolbar disableGutters className="keno-header__toolbar">
          <Box className="keno-header__brand">
            <img src={Logo} alt="Fast Keno" className="keno-header__brand-img" />
          </Box>

          <Box className="keno-header__center">
            <Box className={`keno-header__status-pill${!currentUser ? ' keno-header__status-pill--center' : ''}`}>
              <StatusPill
                currentUser={currentUser}
                userBalance={userBalance}
                roundNo={roundNo}
                onRulesClick={handleOpenOverlay}
                onLoginClick={() => navigate('/profile')}
                isDesktop={isDesktop}
              />
            </Box>
          </Box>

          <Box className="keno-header__actions">
            <Box className="keno-header__desktop-actions">
              <Select
                value={lang}
                onChange={handleLangChange}
                size="small"
                sx={{
                  color: '#71cd95',
                  background: '#121a15',
                  borderRadius: 1,
                  fontSize: '12px',
                  border: '1px solid #71cd95',
                  minWidth: 50,
                  height: 32,
                }}
                variant="outlined"
                disableUnderline
              >
                {languageOptions.map((l) => (
                  <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
                ))}
              </Select>

              {currentUser ? (
                <IconButton
                  onClick={handleLogout}
                  sx={{
                    color: '#71cd95',
                    background: '#121a15',
                    border: '1px solid #71cd95',
                    borderRadius: 1,
                    width: 32,
                    height: 32,
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              ) : (
                <IconButton
                  onClick={() => navigate('/profile')}
                  sx={{
                    color: '#71cd95',
                    background: '#121a15',
                    border: '1px solid #71cd95',
                    borderRadius: 1,
                    width: 32,
                    height: 32,
                  }}
                >
                  <LoginIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            <IconButton onClick={handleOpenOverlay} className="keno-header__menu-btn" aria-label="Menu">
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <RulesOverlay open={overlayOpen} handleClose={handleCloseOverlay} />
    </>
  );
};

export default Header;
