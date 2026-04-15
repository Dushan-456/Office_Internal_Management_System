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
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import WorkOffIcon from '@mui/icons-material/WorkOff';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';
import useThemeStore from '../../store/useThemeStore';
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
  const [dashboardLeaves, setDashboardLeaves] = useState({ today: [], upcoming: [] });
  const [dashboardMessage, setDashboardMessage] = useState('');

  const navigate = useNavigate();
  const { user, fetchCurrentUser } = useAuthStore();
  const { isDarkMode } = useThemeStore();
  const isAdmin = user?.role === 'ADMIN';
  const isTopAdmin = user?.role === 'TOP_ADMIN';
  const isDeptHead = user?.role === 'DEPT_HEAD';

  const ASSET_BASE = import.meta.env.VITE_ASSET_URL || import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:5001';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        if (isAdmin || isTopAdmin) {
          const res = await getEmployeeStats();
          setStats(res.data.data);
        }

        if (user) {
          const actingRes = await leaveApi.getPendingActing();
          if (actingRes.data && actingRes.data.success) {
            setPendingActingCount(actingRes.data.count);
          }
          if (isAdmin || isTopAdmin || isDeptHead) {
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

          // Departmental Dashboard Briefing
          const dashRes = await leaveApi.getDashboardSummary();
          if (dashRes.data && dashRes.data.success) {
            setDashboardLeaves(dashRes.data.data);
            setDashboardMessage(dashRes.data.message || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentUser(); // Ensure latest user balance/stats are loaded
    fetchDashboardData();
  }, [user?.id, isAdmin, isTopAdmin, isDeptHead]);

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
              <Paper className="p-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 shadow-sm" sx={{ bgcolor: isDarkMode ? 'rgba(245, 158, 11, 0.05)' : 'rgba(245, 158, 11, 0.02)' }}>
                <Box className="flex items-center gap-3 text-amber-800">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <NotificationImportantIcon color="warning" />
                  </motion.div>
                  <Typography variant="body1" className="font-bold" sx={{ color: isDarkMode ? 'warning.main' : 'amber.800' }}>
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
              <Paper className="p-4 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 shadow-sm" sx={{ bgcolor: isDarkMode ? 'rgba(239, 68, 68, 0.05)' : 'rgba(239, 68, 68, 0.02)' }}>
                <Box className="flex items-center gap-3 text-red-800">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                  >
                    <NotificationImportantIcon color="error" />
                  </motion.div>
                  <Typography variant="body1" className="font-bold" sx={{ color: isDarkMode ? 'error.main' : 'red.800' }}>
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
              onClick={() => navigate((isAdmin || isTopAdmin) ? '/employees' : '/my-profile')}
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
              {(isAdmin || isTopAdmin) ? 'System Directory' : 'My Portal'}
            </Button>
          </Box>
        </Box>
      </motion.div>

      {/* Main Two-Column Dashboard Grid */}
      <Grid container spacing={4} sx={{ flexWrap: { md: 'nowrap', xs: 'wrap' } }}>
        
        {/* Left Column: Personal Leave Analytics (40%) */}
        <Grid item sx={{ width: { xs: '100%', md: '40%' }, flexBasis: { md: '40%' }, maxWidth: { md: '40%' }, flexShrink: 0 }}>
          <Box className="flex items-center justify-between mb-6">
            <Typography variant="h5" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
              Your Leave <span style={{ color: siteConfig.colors.primary }}>Analytics</span>
              <Typography variant="caption" className="!ml-5 px-2 py-0.5 !text-2xl rounded-lg bg-slate-100 text-slate-500 font-black">
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

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
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
                value: personalLeaves
                  .filter(l => l.status === 'approved')
                  .reduce((sum, l) => sum + (l.totalDays || 0), 0),
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
                label: 'Available Leaves', 
                value: `${user?.leaveBalances?.find(b => b.year === new Date().getFullYear())?.annualBalance ?? 0} `,
                color: '#6cef44ff',
                icon: <ArrowForwardIosIcon />
              },
              { 
                label: 'Medical Used', 
                value: personalLeaves
                  .filter(l => l.status === 'approved' && l.leaveType === 'Medical')
                  .reduce((sum, l) => sum + (l.totalDays || 0), 0),
                color: '#ec4899',
                icon: <VerifiedUserIcon />
              },
              { 
                label: 'Casual Used', 
                value: personalLeaves
                  .filter(l => l.status === 'approved' && l.leaveType === 'Casual')
                  .reduce((sum, l) => sum + (l.totalDays || 0), 0),
                color: '#f59e0b',
                icon: <CheckCircleIcon />
              }
            ].map((item, idx) => (
              <div key={idx} className="flex">
                <Paper className="glass-card p-5 rounded-3xl border border-slate-50 relative overflow-hidden group h-full w-full flex flex-col justify-between">
                  {item.pulse && (
                    <Box className="absolute inset-0 bg-current opacity-[0.03] animate-pulse" sx={{ color: item.color }} />
                  )}
                  <Box className="flex items-center gap-3 mb-3 relative z-10">
                     <Box sx={{ color: item.color }}>{item.icon}</Box>
                     <Typography variant="caption" className="font-black uppercase tracking-widest text-slate-400" sx={{ fontSize: '0.6rem' }}>{item.label}</Typography>
                  </Box>
                  <Typography variant="h4" className="font-black text-center relative z-10" sx={{ color: 'var(--text-heading)' }}>
                    {item.value}
                  </Typography>
                </Paper>
              </div>
            ))}
          </div>

          {/* Type Breakdown */}
          <Paper className="glass-card p-6 rounded-[2rem] border border-slate-50">
            <Typography variant="body2" className="font-black mb-4 uppercase tracking-tighter text-slate-500">Distribution by Leave Type</Typography>
            <Box className="space-y-4">
              {(() => {
                const approvedLeaves = personalLeaves.filter(l => l.status === 'approved');
                const uniqueTypes = [...new Set(approvedLeaves.map(l => l.leaveType))].sort();
                
                return uniqueTypes.map(type => {
                  const days = approvedLeaves.filter(l => l.leaveType === type).reduce((sum, l) => sum + (l.totalDays || 0), 0);
                  const total = approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0) || 1;
                  const percentage = Math.round((days / total) * 100);
                  const typeColors = { Annual: '#6366f1', Medical: '#10b981', Casual: '#f59e0b', Short: '#ec4899' };
                  const color = typeColors[type] || siteConfig.colors.primary;

                  return (
                    <Box key={type}>
                      <Box className="flex justify-between mb-1">
                        <Typography variant="body2" className="font-bold">{type} Leave</Typography>
                        <Typography variant="body2" className="font-bold">{days} Days</Typography>
                      </Box>
                      <Box className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          className="h-full rounded-full"
                          transition={{ duration: 1, ease: "easeOut" }}
                          style={{ backgroundColor: color }}
                        />
                      </Box>
                    </Box>
                  );
                });
              })()}
              {personalLeaves.filter(l => l.status === 'approved').length === 0 && (
                <Typography variant="caption" className="text-slate-400 italic">No approved leave records for this year.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Workforce Intelligence & Departmental Absences (60%) */}
        <Grid item sx={{ width: { xs: '100%', md: '60%' }, flexBasis: { md: '60%' }, maxWidth: { md: '60%' }, flexShrink: 0 }}>
          <Box className="space-y-8">
            <div className="flex flex-col md:flex-row gap-6 w-full px-5 items-stretch">
              {/* Who's Away Today */}
              <div className="flex-1 w-full flex">
                <Paper className="glass-card p-8 rounded-[2rem] border-none overflow-hidden relative w-full">
                  <Box className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-full -mr-16 -mt-16 opacity-50" />
                  <Box className="flex items-center justify-between mb-6 relative z-10">
                    <Box>
                        <Typography variant="h6" className="font-extrabold flex items-center gap-2" sx={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                          <CalendarTodayIcon sx={{ color: siteConfig.colors.primary }} />
                          Who's Away <span style={{ color: siteConfig.colors.primary }}>Today</span>
                        </Typography>
                       <Typography variant="body2" className="font-bold pl-8" sx={{ color: 'var(--text-secondary)' }}>
                       {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                       </Typography>
                    </Box>
                    
                    <Chip 
                       label={(isAdmin || isTopAdmin) ? "Institutional" : user?.department?.replace(/_/g, ' ')} 
                       size="small" 
                       sx={{ fontWeight: 800, borderRadius: '8px', bgcolor: 'var(--input-bg)' }} 
                    />
                  </Box>
                 

                  {dashboardMessage && (
                    <Typography variant="body2" className="text-slate-400 italic text-center py-4">{dashboardMessage}</Typography>
                  )}

                  {!dashboardMessage && dashboardLeaves.today.length === 0 && (
                    <Box className="flex flex-col items-center justify-center py-8 opacity-40">
                       <CheckCircleIcon sx={{ fontSize: 40, mb: 1, color: '#10b981' }} />
                       <Typography variant="body2" className="font-bold">Everyone is present today!</Typography>
                    </Box>
                  )}

                  <Box className="flex flex-wrap gap-4 relative z-10">
                    {dashboardLeaves.today.map((leave, idx) => (
                      <motion.div
                        key={leave._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group flex flex-col items-center p-2 rounded-3xl transition-all duration-300 hover:scale-[1.05] relative w-[130px]"
                        style={{ 
                          background: 'rgba(105, 163, 218, 0.4)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.05)'
                        }}
                      >
                        <Box className="relative ">
                          <Avatar 
                            src={leave.applicantId?.profilePicture ? 
                              (leave.applicantId.profilePicture.startsWith('/uploads') ? 
                                `${ASSET_BASE}${leave.applicantId.profilePicture}` : 
                                `${ASSET_BASE}/uploads/${leave.applicantId.profilePicture}`) : ''}
                            sx={{ 
                              width: 64, 
                              height: 64, 
                              border: `3px solid ${siteConfig.colors.primary}40`,
                              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                              '.group:hover &': { 
                                borderColor: siteConfig.colors.primary,
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            {leave.applicantId?.firstName?.charAt(0)} 
                          </Avatar>
                          <Box 
                            className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                            sx={{ bgcolor: 'red' }}
                          />
                        </Box>
                        
                        <Typography 
                          variant="caption" 
                          className="font-black text-center mb-1 transition-colors duration-300" 
                          sx={{ 
                            color: 'var(--text-heading)',
                            fontSize: '0.75rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {leave.applicantId.firstName} {leave.applicantId.lastName}
                        </Typography>
                        
                        <Chip 
                          label={leave.leaveType} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.6rem', 
                            height: 18, 
                            fontWeight: 900, 
                            bgcolor: `${siteConfig.colors.primary}15`,
                            color: siteConfig.colors.primary,
                            border: `1px solid ${siteConfig.colors.primary}30`,
                            textTransform: 'uppercase',
                            letterSpacing: '0.025em'
                          }} 
                        />
                      </motion.div>
                    ))}
                  </Box>
                </Paper>
              </div>

              {/* Upcoming Absences (14 Days) */}
              <div className="flex-1 w-full flex">
                <Paper className="glass-card p-8 rounded-[2rem] border-none w-full">
                  <Box className="flex items-center justify-between mb-6 ">
                    <Typography variant="h6" className="font-extrabold flex items-center gap-2" sx={{ color: 'var(--text-heading)', whiteSpace: 'nowrap' }}>
                      <EventAvailableIcon sx={{ color: siteConfig.colors.primary }} />
                      Upcoming <span style={{ color: siteConfig.colors.primary }}>Absences</span>
                    </Typography>
                    <Typography variant="caption" className="font-black text-slate-400">Next 14 Days</Typography>
                  </Box>

                  <Box className="space-y-4">
                    {dashboardLeaves.upcoming.length === 0 && !dashboardMessage && (
                      <Typography variant="body2" className="text-slate-400 italic text-center py-6">No absences scheduled for the next 14 days.</Typography>
                    )}

                    {dashboardLeaves.upcoming.map((leave, idx) => (
                      <motion.div
                        key={leave._id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-2xl border border-slate-50 hover:border-slate-500 transition-colors w-full"
                      >
                        <Box className="flex items-center gap-3">
                          <Avatar 
                            src={leave.applicantId?.profilePicture ? 
                              (leave.applicantId.profilePicture.startsWith('/uploads') ? 
                                `${ASSET_BASE}${leave.applicantId.profilePicture}` : 
                                `${ASSET_BASE}/uploads/${leave.applicantId.profilePicture}`) : ''}
                            sx={{ width: 40, height: 40 }}
                          >
                            {leave.applicantId?.firstName?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" className="font-black" sx={{ color: 'var(--text-heading)' }}>
                              {leave.applicantId.firstName} {leave.applicantId.lastName}
                            </Typography>
                            <Typography variant="caption" className="text-slate-400 font-bold">
                              {new Date(leave.dateRange.from).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {new Date(leave.dateRange.to).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </Typography>
                          </Box>
                        </Box>
                        <Box className="text-right">
                           <Chip 
                             label={leave.leaveType} 
                             size="small" 
                             sx={{ 
                               fontWeight: 900, 
                               fontSize: '0.6rem', 
                               bgcolor: `${siteConfig.colors.primary}10`,
                               color: siteConfig.colors.primary
                             }} 
                           />
                           <Typography variant="caption" className="block mt-1 font-black text-slate-400" sx={{ fontSize: '0.65rem' }}>
                             {leave.totalDays} Day(s)
                           </Typography>
                        </Box>
                      </motion.div>
                    ))}
                  </Box>
                </Paper>
              </div>
            </div>
            
            {(isAdmin || isTopAdmin) && (
              <>
                 <Typography variant="h5" className="font-black tracking-tight mt-8 mb-6" sx={{ color: 'var(--text-heading)' }}>
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
              </>
            )}
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
