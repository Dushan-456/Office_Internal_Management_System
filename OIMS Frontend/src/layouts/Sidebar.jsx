import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Box,
  Typography,
  Divider 
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventNoteIcon from '@mui/icons-material/EventNote';

const drawerWidth = 240;

const Sidebar = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar className="bg-slate-50 border-b border-slate-200">
        <Typography variant="h6" className="font-bold text-blue-800 w-full text-center">
          OIMS Portal
        </Typography>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto' }} className="bg-slate-50 h-full">
        <List>
          {isAdmin && (
            <>
              <ListItem component={NavLink} to="/admin/users/add" 
                className={({isActive}) => isActive ? "bg-blue-100 m-2 rounded-md" : "hover:bg-slate-100 m-2 rounded-md"}>
                <ListItemIcon><GroupAddIcon className="text-blue-600" /></ListItemIcon>
                <ListItemText primary="Add New User" sx={{ '& .MuiTypography-root': { fontWeight: '500', color: '#334155' } }} />
              </ListItem>
              <ListItem component={NavLink} to="/admin/users"
                className={({isActive}) => isActive ? "bg-blue-100 m-2 rounded-md" : "hover:bg-slate-100 m-2 rounded-md"}>
                <ListItemIcon><PeopleIcon className="text-blue-600" /></ListItemIcon>
                <ListItemText primary="User List" sx={{ '& .MuiTypography-root': { fontWeight: '500', color: '#334155' } }} />
              </ListItem>
            </>
          )}

          {(!isAdmin && user) && (
            <>
              <ListItem component={NavLink} to="/employee/attendance"
                className={({isActive}) => isActive ? "bg-blue-100 m-2 rounded-md" : "hover:bg-slate-100 m-2 rounded-md"}>
                <ListItemIcon><AssignmentIcon className="text-blue-600" /></ListItemIcon>
                <ListItemText primary="My Attendance" sx={{ '& .MuiTypography-root': { fontWeight: '500', color: '#334155' } }} />
              </ListItem>
              <ListItem component={NavLink} to="/employee/leave"
                className={({isActive}) => isActive ? "bg-blue-100 m-2 rounded-md" : "hover:bg-slate-100 m-2 rounded-md"}>
                <ListItemIcon><EventNoteIcon className="text-blue-600" /></ListItemIcon>
                <ListItemText primary="Apply Leave" sx={{ '& .MuiTypography-root': { fontWeight: '500', color: '#334155' } }} />
              </ListItem>
            </>
          )}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
