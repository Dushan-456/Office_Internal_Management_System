import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { siteConfig } from '../config/siteConfig';
import { leaveApi } from '../api/leaveApi';
import { 
  Paper, 
  BottomNavigation, 
  BottomNavigationAction, 
  Box,
  Badge
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ApprovalIcon from '@mui/icons-material/Approval';
import EventNoteIcon from '@mui/icons-material/EventNote';

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isDeptHead = user?.role === 'DEPT_HEAD';

  const [pendingActingCount, setPendingActingCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [myPendingCount, setMyPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        if (user) {
          const myPendingRes = await leaveApi.getMyPendingCount();
          if (myPendingRes.data?.success) setMyPendingCount(myPendingRes.data.count);

          const actingRes = await leaveApi.getPendingActing();
          if (actingRes.data?.success) setPendingActingCount(actingRes.data.count);
          
          if (isAdmin || isDeptHead) {
            const approvalRes = await leaveApi.getPendingApproval();
            if (approvalRes.data?.success) setPendingApprovalCount(approvalRes.data.count);
          }
        }
      } catch (error) {
        console.error("Bottom Nav count fetch failed", error);
      }
    };
    fetchPendingCounts();
    window.addEventListener('refreshPendingCounts', fetchPendingCounts);
    return () => window.removeEventListener('refreshPendingCounts', fetchPendingCounts);
  }, [user, isAdmin, isDeptHead, location.pathname]);

  // Curated 5 items based on Role
  const menuItems = isAdmin || isDeptHead ? [
    { label: 'Home', icon: <DashboardIcon />, path: '/' },
    { label: 'Requests', icon: <Badge badgeContent={pendingApprovalCount} color="error"><ApprovalIcon /></Badge>, path: '/leaves/requests' },
    { label: 'Users', icon: <PeopleIcon />, path: '/employees' },
    { label: 'Acting', icon: <Badge badgeContent={pendingActingCount} color="warning"><AssignmentTurnedInIcon /></Badge>, path: '/leaves/acting' },
    { label: 'Profile', icon: <AccountCircleIcon />, path: '/my-profile' },
  ] : [
    { label: 'Home', icon: <DashboardIcon />, path: '/' },
    { label: 'Apply', icon: <EventAvailableIcon />, path: '/leaves/apply' },
    { label: 'My Leaves', icon: <Badge badgeContent={myPendingCount} color="error"><EventNoteIcon /></Badge>, path: '/leaves/my-details' },
    { label: 'Acting', icon: <Badge badgeContent={pendingActingCount} color="warning"><AssignmentTurnedInIcon /></Badge>, path: '/leaves/acting' },
    { label: 'Profile', icon: <AccountCircleIcon />, path: '/my-profile' },
  ];

  return (
    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
      <Paper 
        elevation={0} 
        className="glass-card"
        sx={{ 
          position: 'fixed', 
          bottom: 12, 
          left: 12, 
          right: 12, 
          zIndex: 1000,
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
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
              minWidth: 0,
              px: 0,
              color: '#94a3b8',
              '&.Mui-selected': {
                color: siteConfig.colors.primary,
                '& .MuiBottomNavigationAction-label': {
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  mt: 0.5,
                  textTransform: 'uppercase'
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
              sx={{
                '& .MuiSvgIcon-root': { fontSize: 22 },
                '& .MuiBadge-badge': {
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  minWidth: 16,
                  height: 16,
                  p: 0,
                  top: 2,
                  right: -2
                }
              }}
            />
          ))}
        </BottomNavigation>
      </Paper>
    </Box>
  );
};

export default MobileBottomNav;
