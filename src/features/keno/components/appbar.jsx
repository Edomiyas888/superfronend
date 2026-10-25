import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import { IconButton } from "@mui/material";
import Logo from '../../../../reference/safarigames-assets/images/image.png';
import RulesOverlay from './riles';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import { Select, MenuItem } from '@mui/material';
import { t, getCurrentLanguage, setCurrentLanguage } from '../utils/translator';
import { useAuth } from '../contexts/AuthContext';
import { formatKenoMoney } from '../utils/formatKenoMoney';
import './keno-header.css';
import './font.css';

const StatusPill = ({
  currentUser,
  userBalance,
  roundNo,
  onRulesClick,
  onLoginClick,
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
      <Box className="header_center_left">
        <span className="header_credit">
          {formatKenoMoney(userBalance ?? 0)} <span>ETB</span>
        </span>
      </Box>

      <Box className="header_center_right">
        {roundNo ? (
          <button type="button" className="game_id" onClick={onRulesClick}>
            ID: <span className="game_id_num">{roundNo}</span>
          </button>
        ) : null}
      </Box>
    </>
  );
};

const Header = ({ roundNo = null }) => {
  const navigate = useNavigate();
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

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
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
      <header className="keno-header">
        <div className="keno-header__toolbar">
          <Box className="keno-header__brand">
            <button type="button" className="keno-header__back" aria-label="Back" onClick={handleBack}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <img src={Logo} alt="Fast Keno" className="header_logo_mobile" />
          </Box>

          <Box className="keno-header__center">
            <Box className={`header_center${!currentUser ? ' header_center--guest' : ''}`}>
              <StatusPill
                currentUser={currentUser}
                userBalance={userBalance}
                roundNo={roundNo}
                onRulesClick={handleOpenOverlay}
                onLoginClick={() => navigate('/profile')}
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

            <button type="button" onClick={handleOpenOverlay} className="settings_icon" aria-label="Menu">
              <svg className="menu_open" viewBox="0 0 15 14" aria-hidden="true">
                <rect width="15" height="2" rx="1" y="0" fill="#71ce96" />
                <rect width="15" height="2" rx="1" y="6" fill="#71ce96" />
                <rect width="15" height="2" rx="1" y="12" fill="#71ce96" />
              </svg>
            </button>
          </Box>
        </div>
      </header>
      <RulesOverlay open={overlayOpen} handleClose={handleCloseOverlay} />
    </>
  );
};

export default Header;
