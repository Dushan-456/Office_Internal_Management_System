import React from 'react';
import { Box, Typography } from '@mui/material';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import ComputerIcon from '@mui/icons-material/Computer';
import BadgeIcon from '@mui/icons-material/Badge';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { siteConfig } from '../config/siteConfig';

const DemoAccounts = ({ onSelect }) => {
  const accounts = [
    { role: 'System Admin', email: 'admin@office.com', icon: <BadgeIcon fontSize="small" /> },
    { role: 'Department Head', email: 'head.computer@office.com', icon: <BadgeIcon fontSize="small" /> },
    { role: 'Employee 01', email: 'emp11@computer.com', icon: <LockOutlinedIcon fontSize="small" /> },
    { role: 'Employee 02', email: 'emp12@computer.com', icon: <LockOutlinedIcon fontSize="small" /> },
    { role: 'Employee 03', email: 'emp13@computer.com', icon: <LockOutlinedIcon fontSize="small" /> },
  ];

  return (
    <Box className="w-full">
      <Box className="glass-card p-6 rounded-[2rem] border border-white/20">
        <Box className="flex items-center gap-2 mb-4">
          <ComputerIcon sx={{ color: siteConfig.colors.primary }} />
          <Typography variant="subtitle1" className="font-bold text-slate-700 dark:text-slate-200">
            Demo Accounts - Computer Dept
          </Typography>
        </Box>
        
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {accounts.map((acc) => (
            <Box
              key={acc.email}
              onClick={() => onSelect(acc.email, 'password123')}
              className="p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 cursor-pointer transition-all border border-slate-200/50 dark:border-slate-700/50 flex flex-col group"
            >
              <Box className="flex items-center justify-between mb-1">
                <Typography variant="caption" className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                  {acc.role}
                </Typography>
                <ContentPasteIcon className="text-slate-300 group-hover:text-primary transition-colors" sx={{ fontSize: 14 }} />
              </Box>
              <Typography variant="body2" className="text-slate-700 dark:text-slate-300 font-semibold break-all">
                {acc.email}
              </Typography>
              <Typography variant="caption" className="text-slate-400">
                PW: password123
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default DemoAccounts;
