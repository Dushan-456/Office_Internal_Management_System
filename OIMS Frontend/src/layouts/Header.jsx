import React from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useThemeStore from '../store/useThemeStore';
import { siteConfig } from '../config/siteConfig';
import { 
  Box, 
  Typography, 
  Avatar, 
  Chip, 
  IconButton, 
  Tooltip,
  Badge,
  Divider
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded';
import MenuIcon from '@mui/icons-material/Menu';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from '../components/NotificationBell';

const Header = ({ onToggleMenu }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  const roleLabels = {
    ADMIN: 'System Administrator',
    TOP_ADMIN: 'Top Management',
    DEPT_HEAD: 'Department Head',
    EMPLOYEE: 'Staff Member',
  };

  const roleColors = {
    ADMIN: siteConfig.colors.primary,
    DEPT_HEAD: siteConfig.colors.primary,
    EMPLOYEE: '#10b981',
  };

  return (
    <Box 
      component={motion.header}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass-header h-16 fixed top-0 right-0 z-40 px-6 flex items-center justify-between"
      sx={{ 
        width: { sm: `calc(100% - 280px)` },
        left: { sm: '280px', xs: 0 },
        bgcolor: isDarkMode ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.4)',
      }}
    >
      {/* Left: Branding & Menu Toggle */}
      <Box className="flex items-center gap-3">
        <IconButton
          onClick={onToggleMenu}
          sx={{ 
            display: { sm: 'none' },
            color: 'var(--text-heading)',
            bgcolor: 'rgba(99, 102, 241, 0.1)',
            borderRadius: '12px'
          }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* <Box className="flex flex-col">
          <Typography variant="body2" className="font-medium text-[0.65rem] uppercase tracking-widest hidden xs:block" sx={{ color: 'var(--text-muted)' }}>
            {siteConfig.name}
          </Typography>
          <Typography variant="subtitle1" className="font-bold leading-tight truncate max-w-[120px] md:max-w-none" sx={{ color: 'var(--text-heading)' }}>
            {user?.firstName || 'User'}
          </Typography>
        </Box> */}
      </Box>

      {/* Right: User Details & Notifications */}
      <Box className="flex items-center gap-4">
        <Box className="flex items-center gap-2">
          {/* Theme Toggle */}
          <Tooltip title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
            <IconButton 
              onClick={toggleDarkMode} 
              sx={{ 
                color: 'var(--text-muted)',
                bgcolor: 'transparent',
                '&:hover': { bgcolor: 'transparent', color: siteConfig.colors.primary }
              }}
              component={motion.button}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDarkMode ? 'dark' : 'light'}
                  initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                  transition={{ duration: 0.2, ease: "anticipate" }}
                >
                  {isDarkMode ? (
                    <LightModeOutlinedIcon sx={{ fontSize: 20, fontWeight: 300 }} />
                  ) : (
                    <DarkModeOutlinedIcon sx={{ fontSize: 20, fontWeight: 300 }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </IconButton>
          </Tooltip>

          <NotificationBell />

        </Box>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, my: 2, opacity: 0.5 }} />

        <Box 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => navigate('/my-profile')}
        >
          <Box className="hidden md:flex flex-col items-end transition-transform group-hover:-translate-x-1">
            <Typography variant="body2" className="font-bold leading-none" sx={{ color: 'var(--text-heading)' }}>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Chip 
              label={roleLabels[user?.role] || user?.role} 
              size="small" 
              sx={{ 
                height: 18, 
                fontSize: '0.65rem', 
                fontWeight: 800,
                mt: 0.5,
                bgcolor: `${roleColors[user?.role]}15`,
                color: roleColors[user?.role],
                border: `1px solid ${roleColors[user?.role]}30`,
                cursor: 'pointer'
              }} 
            />
          </Box>

          <Box className="flex items-center gap-2">
            <Avatar 
              src={user?.profilePicture ? `${SERVER_BASE}${user.profilePicture}` : undefined}
              sx={{ 
                width: 38, 
                height: 38, 
                bgcolor: siteConfig.colors.primary,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid white',
                transition: 'transform 0.3s',
                '&:hover': { transform: 'scale(1.1)' }
              }}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
            <IconButton 
              size="small" 
              onClick={(e) => { e.stopPropagation(); logout(); }}
              sx={{ 
                color: '#ef4444', 
                bgcolor: 'rgba(239, 68, 68, 0.08)',
                borderRadius: '8px',
                ml: 1,
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.15)' }
              }}
              className="hidden md:flex"
            >
              <LogoutRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
