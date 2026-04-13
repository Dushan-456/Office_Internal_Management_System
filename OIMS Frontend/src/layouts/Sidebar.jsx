import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { siteConfig } from '../config/siteConfig';
import { leaveApi } from '../api/leaveApi';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ApprovalIcon from '@mui/icons-material/Approval';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalculateIcon from '@mui/icons-material/Calculate';
import CommuteIcon from '@mui/icons-material/Commute';
import { motion } from 'framer-motion';

const drawerWidth = 280;

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isDeptHead = role === 'DEPT_HEAD';

  const [pendingActingCount, setPendingActingCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [myPendingCount, setMyPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCounts = async () => {
      try {
        if (user) {
          // My own pending requests
          const myPendingRes = await leaveApi.getMyPendingCount();
          if (myPendingRes.data && myPendingRes.data.success) {
            setMyPendingCount(myPendingRes.data.count);
          }

          const actingRes = await leaveApi.getPendingActing();
          if (actingRes.data && actingRes.data.success) {
            setPendingActingCount(actingRes.data.count);
          }
          
          if (isAdmin || isDeptHead) {
            const approvalRes = await leaveApi.getPendingApproval();
            if (approvalRes.data && approvalRes.data.success) {
              setPendingApprovalCount(approvalRes.data.count);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch pending counts", error);
      }
    };
    fetchPendingCounts();

    // Listen for custom events to refresh counts
    window.addEventListener('refreshPendingCounts', fetchPendingCounts);
    return () => window.removeEventListener('refreshPendingCounts', fetchPendingCounts);
  }, [user, isAdmin, isDeptHead, location.pathname]); // Re-fetch occasionally or on route change

  const navItemStyle = (isActive) => ({
    borderRadius: '16px',
    mx: 1.5,
    mb: 1.5,
    py: 1.5,
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    position: 'relative',
    bgcolor: isActive ? `${siteConfig.colors.primary}18` : 'transparent',
    color: isActive ? siteConfig.colors.primary : 'var(--text-muted)',
    border: '1px solid',
    borderColor: isActive ? `${siteConfig.colors.primary}30` : 'transparent',
    '&:hover': {
      bgcolor: isActive ? `${siteConfig.colors.primary}25` : `${siteConfig.colors.accent}12`,
      color: siteConfig.colors.accent,
      transform: 'translateX(8px)',
      boxShadow: isActive ? `0 8px 16px ${siteConfig.colors.primary}20` : `0 4px 12px ${siteConfig.colors.accent}15`,
    },
    '&::before': isActive ? {
      content: '""',
      position: 'absolute',
      left: -8,
      top: '25%',
      height: '50%',
      width: '6px',
      bgcolor: siteConfig.colors.primary,
      borderRadius: '0 4px 4px 0',
      boxShadow: `0 0 10px ${siteConfig.colors.primary}`,
    } : {},
  });

  const menuGroups = [
    {
      title: 'MAIN MENU',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/', show: true },
        { text: 'My Profile', icon: <AccountCircleIcon />, path: '/my-profile', show: true },
        { text: 'My Attendance', icon: <AccessTimeIcon />, path: '/attendance', show: true, isSoon: true },
      ]
    },
    {
      title: 'LEAVE MANAGEMENT',
      items: [
        { text: 'Apply Leave', icon: <EventAvailableIcon />, path: '/leaves/apply', show: true },
        { text: 'Acting Requests', icon: <AssignmentTurnedInIcon />, path: '/leaves/acting', show: true, badge: pendingActingCount },
        { text: 'Leave Requests', icon: <ApprovalIcon />, path: '/leaves/requests', show: isAdmin || isDeptHead, badge: pendingApprovalCount },
        { text: 'My Leave Details', icon: <EventNoteIcon />, path: '/leaves/my-details', show: true, badge: myPendingCount },
      ]
    },
    {
      title: 'OPERATIONS',
      items: [
        { text: 'OT Calculator', icon: <CalculateIcon />, path: '/ot-calculator', show: true, isSoon: true },
        { text: 'Vehicle Request', icon: <CommuteIcon />, path: '/vehicle-request', show: true, isSoon: true },
      ]
    },
    {
      title: 'ADMINISTRATION',
      items: [
        { text: 'All Employees', icon: <PeopleIcon />, path: '/employees', show: isAdmin || isDeptHead },
        { text: 'Add Employee', icon: <PersonAddIcon />, path: '/employees/add', show: isAdmin },
      ]
    }
  ];

  const drawerContent = (
    <Box className="glass-sidebar h-full flex flex-col overflow-x-hidden">
      {/* Logo Section */}
      <Toolbar className="px-6 py-8 flex flex-col items-start gap-4 h-auto">
        <Box className="flex items-center gap-3">
          <motion.img 
            src={siteConfig.logo} 
            alt="Logo" 
            className="w-10 h-10 rounded-xl shadow-lg"
            whileHover={{ rotate: 5, scale: 1.05 }}
          />
          <Box>
            <Typography variant="h6" className="font-extrabold leading-none tracking-tight" sx={{ color: 'var(--text-heading)' }}>
              {siteConfig.name.split(' ')[0]} <span style={{ color: siteConfig.colors.primary }}>{siteConfig.name.split(' ')[1]}</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest mt-1 block">
              MANAGEMENT SYSTEM
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box className="flex-1 mt-4">
        {menuGroups.map((group, gIdx) => {
          const visibleItems = group.items.filter(item => item.show);
          if (visibleItems.length === 0) return null;

          return (
            <Box key={group.title} sx={{ mb: 1 }}>
              {/* Category Header */}
              <Typography 
                variant="caption" 
                sx={{ 
                  px: 4, 
                  py: 0, 
                  display: 'block', 
                  color: 'var(--text-muted)', 
                  fontWeight: 800, 
                  letterSpacing: '0.15rem',
                  fontSize: '0.65rem',
                  opacity: 0.6
                }}
              >
                {group.title}
              </Typography>

              <List disablePadding>
                {visibleItems.map((item) => {
                  const isActive = location.pathname === item.path;
                    
                  return (
                    <ListItem
                      key={item.text}
                      component={NavLink}
                      to={item.path}
                      onClick={onClose}
                      sx={navItemStyle(isActive)}
                    >
                      <ListItemIcon sx={{ 
                        minWidth: 40, 
                        color: 'inherit',
                        transition: 'color 0.3s'
                      }}>
                        {React.cloneElement(item.icon, { sx: { fontSize: 22 } })}
                      </ListItemIcon>
                      <ListItemText
                        sx={{ width: '100%', m: 0 }}
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                              <Typography variant="body2" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {item.text}
                              </Typography>
                              {item.badge > 0 && (
                                <Badge 
                                  badgeContent={item.badge} 
                                  color="error"
                                  sx={{
                                    '& .MuiBadge-badge': {
                                      backgroundColor: '#f00000ff',
                                      color: '#fff',
                                      fontWeight: 'bold',
                                      position: 'static',
                                      transform: 'none',
                                      ml: 0
                                    }
                                  }}
                                />
                              )}
                            </Box>
                            
                            {item.isSoon && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  fontSize: '0.55rem', 
                                  fontWeight: 900, 
                                  px: 1, 
                                  py: 0.2, 
                                  borderRadius: '6px', 
                                  bgcolor: 'rgba(0,0,0,0.05)',
                                  color: 'text.disabled',
                                  border: '1px solid rgba(0,0,0,0.1)'
                                }}
                              >
                                SOON
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            </Box>
          );
        })}
      </Box>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile Drawer (Temporary) */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            border: 'none',
            bgcolor: 'transparent'
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer (Permanent) */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            borderRight: 'none',
            boxShadow: 'none',
            background: 'transparent',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
