import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { siteConfig } from '../config/siteConfig';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { motion } from 'framer-motion';

const drawerWidth = 280;

const Sidebar = ({ mobileOpen, onClose }) => {
  const { user } = useAuthStore();
  const location = useLocation();
  const role = user?.role;
  const isAdmin = role === 'ADMIN';
  const isDeptHead = role === 'DEPT_HEAD';

  const navItemStyle = (isActive) => ({
    borderRadius: '16px',
    mx: 2.5,
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

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', show: true },
    { text: 'Add Employee', icon: <PersonAddIcon />, path: '/employees/add', show: isAdmin },
    { text: 'All Employees', icon: <PeopleIcon />, path: '/employees', show: isAdmin || isDeptHead },
    { text: 'My Profile', icon: <AccountCircleIcon />, path: '/my-profile', show: true },
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
              {siteConfig.name.split(' ')[0]}
              <span style={{ color: siteConfig.colors.primary }}>{siteConfig.name.split(' ')[1]}</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-medium uppercase tracking-tighter">
              Management System
            </Typography>
          </Box>
        </Box>
      </Toolbar>

      <Box className="flex-1 mt-4">
        <List disablePadding>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
              
            return item.show && (
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
                primary={item.text}
                primaryTypographyProps={{ 
                  fontWeight: 700, 
                  fontSize: '0.875rem', 
                  letterSpacing: '-0.01em'
                }}
              />
            </ListItem>
          );})}
        </List>
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
