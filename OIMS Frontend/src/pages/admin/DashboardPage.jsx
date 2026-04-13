import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployeeStats } from '../../api/employeeApi';
import { leaveApi } from '../../api/leaveApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, Grid, CircularProgress, Button, Chip, Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import NotificationImportantIcon from '@mui/icons-material/NotificationImportant';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
  >
    <Paper
      elevation={0}
      className="glass-card p-6 h-full rounded-[2rem] transition-all duration-300 hover:-translate-y-2"
    >
      <Box className="flex items-center justify-between mb-4">
        <Box
          className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          sx={{ 
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            boxShadow: `0 8px 16px -4px ${color}50`
          }}
        >
          {React.cloneElement(icon, { sx: { color: 'white', fontSize: 28 } })}
        </Box>
        <Chip 
          label="Live" 
          size="small" 
          sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 800, fontSize: '0.65rem' }} 
        />
      </Box>
      <Typography variant="h3" className="font-extrabold tracking-tight mb-1" sx={{ color: 'var(--text-heading)' }}>
        {value}
      </Typography>
      <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-wider text-[0.7rem]">
        {title}
      </Typography>
    </Paper>
  </motion.div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingActingCount, setPendingActingCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [personalLeaves, setPersonalLeaves] = useState([]);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isDeptHead = user?.role === 'DEPT_HEAD';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin) {
          const res = await getEmployeeStats();
          setStats(res.data.data);
        }

        if (user) {
          const actingRes = await leaveApi.getPendingActing();
          if (actingRes.data && actingRes.data.success) {
            setPendingActingCount(actingRes.data.count);
          }
          if (isAdmin || isDeptHead) {
            const appRes = await leaveApi.getPendingApproval();
            if (appRes.data && appRes.data.success) {
              setPendingApprovalCount(appRes.data.count);
            }
          }

          // Personal Leaves for analytics
          const personalRes = await leaveApi.getMyLeaves();
          if (personalRes.data && personalRes.data.success) {
            // Filter for current year
            const currentYear = new Date().getFullYear();
            const yearData = personalRes.data.data.filter(l => 
              new Date(l.dateRange.from).getFullYear() === currentYear
            );
            setPersonalLeaves(yearData);
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, isAdmin, isDeptHead]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Notifications Banners */}
      {(pendingActingCount > 0 || pendingApprovalCount > 0) && (
        <Box className="mb-6 space-y-3">
          {pendingActingCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: [1, 1.01, 1],
              }}
              transition={{
                scale: {
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }
              }}
            >
              <Paper className="p-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 shadow-sm">
                <Box className="flex items-center gap-3 text-amber-800">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <NotificationImportantIcon color="warning" />
                  </motion.div>
                  <Typography variant="body1" className="font-bold">
                    You have <span className="px-2 py-0.5 rounded-lg bg-amber-200 text-amber-900 animate-pulse">{pendingActingCount}</span> acting leave request(s) waiting for your Approval.
                  </Typography>
                </Box>
                <Button variant="contained" color="warning" size="small" sx={{ borderRadius: '10px', fontWeight: 800 }} onClick={() => navigate('/leaves/acting')}>
                  Review Now
                </Button>
              </Paper>
            </motion.div>
          )}
          {pendingApprovalCount > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ 
                opacity: 1, 
                x: 0,
                scale: [1, 1.01, 1],
              }}
              transition={{ 
                delay: 0.1,
                scale: {
                  repeat: Infinity,
                  duration: 2.2,
                  ease: "easeInOut"
                }
              }}
            >
              <Paper className="p-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 shadow-sm">
                <Box className="flex items-center gap-3 text-red-800">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  >
                    <NotificationImportantIcon color="error" />
                  </motion.div>
                  <Typography variant="body1" className="font-bold">
                    You have <span className="px-2 py-0.5 rounded-lg bg-red-200 text-red-900 animate-pulse">{pendingApprovalCount}</span> leave application(s) pending your final approval.
                  </Typography>
                </Box>
                <Button variant="contained" color="error" size="small" sx={{ borderRadius: '10px', fontWeight: 800 }} onClick={() => navigate('/leaves/requests')}>
                  Process Now
                </Button>
              </Paper>
            </motion.div>
          )}
        </Box>
      )}

      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-[2.5rem] mb-8 shadow-2xl group h-80 flex items-center"
      >
        {/* Background Image with Overlay */}
        <Box 
          className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
          sx={{ 
            backgroundImage: `url(${siteConfig.coverImage})`,
            backgroundSize: 'crop',
            backgroundPosition: 'center',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 100%)',
            }
          }}
        />

        {/* Animated Orbs */}
        <Box className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
        <Box className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full -ml-20 -mb-20 blur-3xl" />

        <Box className="relative z-10 px-10">
          <Typography variant="h3" className="font-black text-white tracking-tighter mb-2">
            Workspace <span style={{ color: siteConfig.colors.accent }}>Intelligence</span>
          </Typography>
          <Typography variant="subtitle1" className="text-white/80 font-medium max-w-lg leading-relaxed">
            Monitor institutional growth, employee distribution, and departmental analytics from your premium command center.
          </Typography>
          <Box className="flex gap-4 mt-8">
            {isAdmin && (
              <Button 
                onClick={() => navigate('/employees/add')}
                variant="contained" 
                className="btn-premium"
                sx={{ px: 4, py: 1.5, borderRadius: '15px', textTransform: 'none', fontWeight: 800 }}
              >
                Add New Resource
              </Button>
            )}
            <Button 
              onClick={() => navigate(isAdmin ? '/employees' : '/my-profile')}
              variant="outlined" 
              sx={{ 
                px: 4, 
                py: 1.5, 
                borderRadius: '15px', 
                textTransform: 'none', 
                fontWeight: 800, 
                color: 'white', 
                borderColor: 'rgba(255,255,255,0.3)',
                '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              {isAdmin ? 'System Directory' : 'My Portal'}
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Main Two-Column Dashboard Grid */}
      <Grid container spacing={4}>
        
        {/* Left Column: Personal Leave Analytics */}
        <Grid item xs={12} lg={6}>
          <Box className="flex items-center justify-between mb-6">
            <Typography variant="h5" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
              Your Leave <span style={{ color: siteConfig.colors.primary }}>Analytics</span>
              <Typography variant="caption" className="ml-2 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-500 font-black">
                {new Date().getFullYear()}
              </Typography>
            </Typography>
            <Button 
              onClick={() => navigate('/leaves/my-details')}
              size="small" 
              sx={{ fontWeight: 800, textTransform: 'none' }}
            >
              View All History
            </Button>
          </Box>

          <Grid container spacing={3} className="mb-6">
            {[
              { 
                label: 'Acting Endors.', 
                value: pendingActingCount,
                color: siteConfig.colors.secondary,
                icon: <VerifiedUserIcon />,
                pulse: pendingActingCount > 0
              },
              { 
                label: 'Approved Leaves', 
                value: personalLeaves.filter(l => l.status === 'approved').length,
                color: '#10b981',
                icon: <CheckCircleIcon />
              },
              { 
                label: 'Pending Approval', 
                value: personalLeaves.filter(l => l.status === 'pending_acting' || l.status === 'pending_approval').length,
                color: '#f59e0b',
                icon: <NotificationImportantIcon />
              },
              { 
                label: 'Rejected Feedbk', 
                value: personalLeaves.filter(l => l.status === 'rejected').length,
                color: '#ef4444',
                icon: <ArrowForwardIosIcon />
              }
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} key={idx}>
                <Paper className="glass-card p-5 rounded-3xl border border-slate-50 relative overflow-hidden group">
                  {item.pulse && (
                    <Box className="absolute inset-0 bg-current opacity-[0.03] animate-pulse" sx={{ color: item.color }} />
                  )}
                  <Box className="flex items-center gap-3 mb-3 relative z-10">
                     <Box sx={{ color: item.color }}>{item.icon}</Box>
                     <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400" sx={{ fontSize: '0.6rem' }}>{item.label}</Typography>
                  </Box>
                  <Typography variant="h4" className="font-black relative z-10" sx={{ color: 'var(--text-heading)' }}>
                    {item.value}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Type Breakdown */}
          <Paper className="glass-card p-6 rounded-[2rem] border border-slate-50">
            <Typography variant="body2" className="font-black mb-4 uppercase tracking-tighter text-slate-500">Distribution by Leave Type</Typography>
            <Box className="space-y-4">
              {['Annual', 'Medical', 'Casual', 'Short'].map(type => {
                const count = personalLeaves.filter(l => l.leaveType?.includes(type)).length;
                const total = personalLeaves.length || 1;
                const percentage = Math.round((count / total) * 100);
                const colors = { Annual: '#6366f1', Medical: '#10b981', Casual: '#f59e0b', Short: '#ec4899' };

                return (
                  <Box key={type}>
                    <Box className="flex justify-between mb-1">
                      <Typography variant="body2" className="font-bold">{type} Leave</Typography>
                      <Typography variant="body2" className="font-black">{count}</Typography>
                    </Box>
                    <Box className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors[type] || '#cbd5e1' }}
                      />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Administrative Analytics (Admins Only) */}
        <Grid item xs={12} lg={6}>
          {isAdmin ? (
            <Box className="space-y-8">
               <Typography variant="h5" className="font-black tracking-tight mb-6" sx={{ color: 'var(--text-heading)' }}>
                  Workforce <span style={{ color: siteConfig.colors.primary }}>Intelligence</span>
                </Typography>
              
              {/* Reshaped Stats Grid (2x2) */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StatCard 
                    title="Active Staff" 
                    value={stats?.totalEmployees || 0} 
                    icon={<PeopleIcon />} 
                    color="#6366f1" 
                    delay={0.1}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard 
                    title="Units" 
                    value={stats?.byDepartment?.length || 0} 
                    icon={<BusinessIcon />} 
                    color="#06b6d4" 
                    delay={0.2}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard 
                    title="Onboarded" 
                    value="0" 
                    icon={<PersonAddIcon />} 
                    color="#10b981" 
                    delay={0.3}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StatCard 
                    title="Permanent" 
                    value={stats?.byEmployeeType?.find(t => t.employeeType === 'Permanent')?.count || 0} 
                    icon={<BadgeIcon />} 
                    color="#f59e0b" 
                    delay={0.4}
                  />
                </Grid>
              </Grid>

              {/* Department Distribution (Condensed) */}
              <Paper className="glass-card p-8 rounded-[2rem]">
                <Box className="flex items-center justify-between mb-8">
                  <Typography variant="h6" className="font-extrabold" sx={{ color: 'var(--text-heading)' }}>
                    Departmental Density
                  </Typography>
                </Box>
                <Box className="space-y-6">
                  {stats?.byDepartment?.slice(0, 5).map((dept, idx) => {
                    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
                    const color = colors[idx % colors.length];
                    const percentage = stats.totalEmployees > 0 
                      ? Math.round((dept.count / stats.totalEmployees) * 100) : 0;
                    
                    return (
                      <Box key={dept.department}>
                        <Box className="flex items-center justify-between mb-2">
                          <Box className="flex items-center gap-3">
                            <Box className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <Typography variant="body2" className="font-bold uppercase text-[0.6rem] text-slate-400">
                              {dept.department?.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="body2" className="font-black text-xs" sx={{ color: 'var(--text-heading)' }}>
                            {dept.count}
                          </Typography>
                        </Box>
                        <Box className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Box>
          ) : (
            /* Standard User / Empty Placeholder on Right */
            <Box className="h-full flex flex-col items-center justify-center p-10 text-center opacity-40">
               {/* This space is reserved for future departmental analytics */}
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
