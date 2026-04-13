import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { siteConfig } from '../config/siteConfig';
import { 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction, 
  Box 
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isDeptHead = user?.role === 'DEPT_HEAD';

  const menuItems = [
    { label: 'Home', icon: <DashboardIcon />, path: '/', show: true },
    { label: 'Register', icon: <PersonAddIcon />, path: '/employees/add', show: isAdmin },
    { label: 'Directory', icon: <PeopleIcon />, path: '/employees', show: isAdmin || isDeptHead },
    { label: 'Profile', icon: <AccountCircleIcon />, path: '/my-profile', show: true },
  ].filter(item => item.show);

  return (
    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
      <Paper 
        elevation={0} 
        className="glass-card"
        sx={{ 
          position: 'fixed', 
          bottom: 16, 
          left: 16, 
          right: 16, 
          zIndex: 1000,
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
        }}
      >
        <BottomNavigation
          showLabels
          value={location.pathname}
          onChange={(event, newValue) => {
            navigate(newValue);
          }}
          sx={{ 
            height: 70, 
            bgcolor: 'transparent',
            '& .MuiBottomNavigationAction-root': {
              color: '#94a3b8',
              '&.Mui-selected': {
                color: siteConfig.colors.primary,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  mt: 0.5
                }
              }
            }
          }}
        >
          {menuItems.map((item) => (
            <BottomNavigationAction
              key={item.label}
              label={item.label}
              value={item.path}
              icon={item.icon}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default MobileBottomNav;
