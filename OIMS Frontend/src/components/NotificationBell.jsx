import React, { useState } from 'react';
import { 
  IconButton, 
  Badge, 
  Tooltip 
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import useNotificationStore from '../store/useNotificationStore';
import NotificationDrawer from './NotificationDrawer';
import { motion } from 'framer-motion';

const NotificationBell = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { unreadCount } = useNotificationStore();

  return (
    <>
      <Tooltip title="View Notifications">
        <IconButton 
          onClick={() => setDrawerOpen(true)}
          sx={{ 
            color: 'var(--text-muted)',
            bgcolor: 'transparent',
            '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.05)', color: 'var(--primary)' }
          }}
          component={motion.button}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Badge 
            badgeContent={unreadCount} 
            color="error"
            sx={{
              '& .MuiBadge-badge': {
                fontSize: '0.65rem',
                height: '16px',
                minWidth: '16px',
                fontWeight: 900
              }
            }}
          >
            <NotificationsNoneIcon sx={{ fontSize: 24 }} />
          </Badge>
        </IconButton>
      </Tooltip>

      <NotificationDrawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
      />
    </>
  );
};

export default NotificationBell;
