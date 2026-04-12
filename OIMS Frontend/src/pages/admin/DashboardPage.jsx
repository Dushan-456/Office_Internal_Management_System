import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEmployeeStats } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, Grid, CircularProgress, Button, Chip, Avatar
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import BadgeIcon from '@mui/icons-material/Badge';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

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
  const navigate = useNavigate()
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const fetchStats = async () => {
      try {
        const res = await getEmployeeStats();
        setStats(res.data.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-full">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
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

      {isAdmin && (
        <>
          {/* Stats Grid */}
          <Grid container spacing={4} className="mb-10">
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Active Workforce" 
                value={stats?.totalEmployees || 0} 
                icon={<PeopleIcon />} 
                color="#6366f1" 
                delay={0.1}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Institutional Units" 
                value={stats?.byDepartment?.length || 0} 
                icon={<BusinessIcon />} 
                color="#06b6d4" 
                delay={0.2}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Onboarded Today" 
                value="0" 
                icon={<PersonAddIcon />} 
                color="#10b981" 
                delay={0.3}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard 
                title="Senior Staff" 
                value={stats?.byEmployeeType?.find(t => t.employeeType === 'Permanent')?.count || 0} 
                icon={<BadgeIcon />} 
                color="#f59e0b" 
                delay={0.4}
              />
            </Grid>
          </Grid>

          {/* Analytics Row */}
          <Grid container spacing={4}>
            <Grid item xs={12} lg={8}>
              <Paper className="glass-card p-8 rounded-[2.5rem]">
                <Box className="flex items-center justify-between mb-8">
                  <Typography variant="h6" className="font-extrabold" sx={{ color: 'var(--text-heading)' }}>
                    Departmental Density
                  </Typography>
                  <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 10 }} />} sx={{ textTransform: 'none', fontWeight: 700 }}>
                    Details
                  </Button>
                </Box>
                <Box className="space-y-6">
                  {stats?.byDepartment?.map((dept, idx) => {
                    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
                    const color = colors[idx % colors.length];
                    const percentage = stats.totalEmployees > 0 
                      ? Math.round((dept.count / stats.totalEmployees) * 100) : 0;
                    
                    return (
                      <Box key={dept.department}>
                        <Box className="flex items-center justify-between mb-2">
                          <Box className="flex items-center gap-3">
                            <Box className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <Typography variant="body2" className="font-bold" sx={{ color: 'var(--text-muted)' }}>
                              {dept.department?.replace(/_/g, ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="body2" className="font-black" sx={{ color: 'var(--text-heading)' }}>
                            {dept.count} <span className="text-slate-400 font-medium text-xs ml-1">({percentage}%)</span>
                          </Typography>
                        </Box>
                        <Box className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper className="glass-card p-8 rounded-[2.5rem] h-full">
                <Typography variant="h6" className="font-extrabold mb-6" sx={{ color: 'var(--text-heading)' }}>
                  Employment Mix
                </Typography>
                <Box className="space-y-4">
                  {stats?.byEmployeeType?.map((type, idx) => {
                    const colors = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#06b6d4'];
                    const color = colors[idx % colors.length];
                    return (
                      <Box 
                        key={type.employeeType}
                        className="flex justify-between items-center p-4 rounded-2xl border border-slate-50 hover:border-slate-100 transition-colors"
                      >
                        <Typography variant="body2" className="font-bold" sx={{ color: 'var(--text-muted)' }}>
                          {type.employeeType?.replace(/_/g, ' ')}
                        </Typography>
                        <Box 
                          className="px-3 py-1 rounded-lg text-white font-black text-sm"
                          style={{ backgroundColor: color }}
                        >
                          {type.count}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DashboardPage;
