import React, { useEffect } from 'react';
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Button,
  Chip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import EventNoteIcon from '@mui/icons-material/EventNote';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';

import useNotificationStore from '../store/useNotificationStore';
import useThemeStore from '../store/useThemeStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationDrawer = ({ open, onClose }) => {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead, isLoading } = useNotificationStore();
  const { isDarkMode } = useThemeStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.link) {
      navigate(notif.link);
      onClose();
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'LEAVE_APPLIED': return <EventNoteIcon sx={{ color: '#6366f1' }} />;
      case 'ACTING_DECISION': return <VerifiedUserIcon sx={{ color: '#f59e0b' }} />;
      case 'FINAL_DECISION': return <CheckCircleIcon sx={{ color: '#10b981' }} />;
      case 'LEAVE_DELETED': return <DeleteForeverIcon sx={{ color: '#ef4444' }} />;
      default: return <FiberManualRecordIcon />;
    }
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now - then) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { backdropFilter: 'blur(4px)', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.5)' : 'rgba(15, 23, 42, 0.3)' }
        }
      }}
      PaperProps={{
        sx: { 
          width: { xs: '100%', sm: 400 },
          background: isDarkMode ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid',
          borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
          color: isDarkMode ? '#f1f5f9' : '#1e293b'
        }
      }}
    >
      <Box className="h-full flex flex-col">
        {/* Header */}
        <Box className="p-6 flex items-center justify-between">
          <Box>
            <Typography variant="h6" className="font-black">Activity Center</Typography>
            <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-wider">
              Real-time workflow alerts
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ opacity: isDarkMode ? 0.1 : 1 }} />

        {/* Actions */}
        <Box className="px-6 py-3 flex justify-between items-center" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
           <Typography variant="caption" className="font-black" sx={{ color: isDarkMode ? 'slate.400' : 'slate.500' }}>
             {notifications.filter(n => !n.isRead).length} New Updates
           </Typography>
           <Button 
             size="small" 
             startIcon={<DoneAllIcon />}
             onClick={markAllAsRead}
             sx={{ 
               fontSize: '0.65rem', 
               fontWeight: 800, 
               textTransform: 'none',
               color: '#6366f1'
             }}
           >
             Mark all read
           </Button>
        </Box>

        <Divider sx={{ opacity: isDarkMode ? 0.1 : 1 }} />

        {/* List */}
        <Box className="flex-1 overflow-y-auto">
          <List className="p-0">
            <AnimatePresence>
              {notifications.length === 0 ? (
                <Box className="flex flex-col items-center justify-center h-64 opacity-20">
                   <NotificationsNoneIcon sx={{ fontSize: 60, mb: 2 }} />
                   <Typography variant="body2" className="font-bold">No notifications yet</Typography>
                </Box>
              ) : (
                notifications.map((notif, index) => (
                  <ListItem 
                    key={notif._id}
                    component={motion.div}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    button
                    onClick={() => handleNotificationClick(notif)}
                    sx={{ 
                      px: 3, 
                      py: 2.5,
                      borderBottom: '1px solid',
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      bgcolor: notif.isRead ? 'transparent' : (isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'),
                      position: 'relative',
                      '&:hover': { bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }
                    }}
                  >
                     <Avatar sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'white', border: '1px solid', borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', mr: 2 }}>
                       {getIcon(notif.type)}
                     </Avatar>
                     <ListItemText 
                        primary={
                          <Typography variant="body2" className={`leading-snug ${notif.isRead ? 'font-medium' : 'font-black'}`}>
                            {notif.message}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" className="text-slate-400 font-bold">
                            {formatTimestamp(notif.createdAt)}
                          </Typography>
                        }
                     />
                     {!notif.isRead && (
                       <Box 
                         className="w-2 h-2 rounded-full bg-indigo-500 absolute right-4 top-1/2 -translate-y-1/2" 
                         component={motion.div}
                         animate={{ scale: [1, 1.5, 1] }}
                         transition={{ repeat: Infinity, duration: 2 }}
                       />
                     )}
                  </ListItem>
                ))
              )}
            </AnimatePresence>
          </List>
        </Box>

        {/* Global Stats or Promo Footer */}
        <Box className="p-6" sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
           <Typography variant="caption" className="text-center block font-bold" sx={{ color: isDarkMode ? 'slate.500' : 'slate.400' }}>
             OIMS Real-time Engine v1.0
           </Typography>
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationDrawer;
