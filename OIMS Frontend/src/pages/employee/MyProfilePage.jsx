import {
  Box, Typography, Paper, CircularProgress, Avatar, Chip, Grid, Divider, Alert, Stack,
  TextField, Button, InputAdornment, IconButton, Snackbar
} from '@mui/material';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useForm, Controller } from 'react-hook-form';
import { getMyProfile, updatePassword } from '../../api/employeeApi';
import { motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { siteConfig } from '../../config/siteConfig';

const SectionHeader = ({ icon, title }) => (
  <Box className="flex items-center gap-3 mb-6">
    <Box className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
      {React.cloneElement(icon, { sx: { fontSize: 20, color: siteConfig.colors.primary } })}
    </Box>
    <Typography variant="h6" className="font-extrabold tracking-tight" sx={{ color: 'var(--text-heading)' }}>
      {title}
    </Typography>
  </Box>
);

const InfoRow = ({ icon, label, value, color = siteConfig.colors.primary }) => (
  <Box className="flex items-start gap-4 p-4 rounded-2xl border border-transparent transition-all hover:shadow-md group" sx={{ 
    '&:hover': { 
      bgcolor: `${color}08`, 
      borderColor: `${color}20 !important`,
      transform: 'translateY(-2px)'
    } 
  }}>
    <Box className="mt-0.5 p-2 rounded-xl transition-all group-hover:scale-110" sx={{ bgcolor: `${color}15`, border: `1px solid ${color}20` }}>
      {React.cloneElement(icon, { sx: { fontSize: 18, color } })}
    </Box>
    <Box className="flex-1">
      <Typography variant="caption" className="font-bold uppercase tracking-widest text-slate-400 block mb-0.5" sx={{ fontSize: '0.6rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" className="font-bold" sx={{ color: 'var(--text-heading)' }}>
        {value || 'Not Disclosed'}
      </Typography>
    </Box>
  </Box>
);

const MyProfilePage = () => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [passSuccess, setPassSuccess] = useState(false);
  const [passError, setPassError] = useState(null);
  const [isChanging, setIsChanging] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { control, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' }
  });

  const newPassword = watch('newPassword');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getMyProfile();
        setEmployee(res.data.data.user);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onPasswordSubmit = async (data) => {
    setIsChanging(true);
    setPassError(null);
    try {
      await updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setPassSuccess(true);
      reset();
    } catch (err) {
      setPassError(err.response?.data?.message || 'Verification Failed');
    } finally {
      setIsChanging(false);
    }
  };

  if (loading) return (
    <Box className="h-[60vh] flex flex-col justify-center items-center gap-4">
      <CircularProgress thickness={5} size={60} sx={{ color: siteConfig.colors.primary }} />
      <Typography variant="body2" className="text-slate-400 font-bold animate-pulse">Retrieving Personal Identity...</Typography>
    </Box>
  );

  if (error) return (
    <Box className="p-10">
      <Alert severity="error" variant="filled" className="rounded-2xl">
        Authentication Sync Failed: {error}
      </Alert>
    </Box>
  );

  const emp = employee;
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  
  const roleStyles = {
    ADMIN: { bg: '#fee2e2', color: '#ef4444', label: 'System Administrator', icon: <VerifiedUserIcon /> },
    DEPT_HEAD: { bg: '#ede9fe', color: '#8b5cf6', label: 'Department Head', icon: <WorkHistoryIcon /> },
    EMPLOYEE: { bg: '#d1fae5', color: '#10b981', label: 'Staff Member', icon: <BadgeOutlinedIcon /> },
  };

  const currentRole = roleStyles[emp.role] || roleStyles.EMPLOYEE;

  return (
    <Box className="pb-20 max-w-7xl mx-auto px-4">
      <Box className="mb-10">
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          My <span style={{ color: siteConfig.colors.primary }}>Portal</span>
        </Typography>
        <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest" sx={{ fontSize: '0.6rem' }}>
          Personal Command Center • Secure Access
        </Typography>
      </Box>

      {/* Main Dual-Panel Layout (Flex-based for better sticky support) */}
      <Box className="flex flex-col lg:flex-row items-start gap-10">
        
        {/* Left Panel: Sticky Profile Sidebar */}
        <Box className="w-full lg:w-[380px] xl:w-[420px] lg:sticky top-24 z-10 shrink-0">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Paper className="glass-card rounded-[3rem] text-center relative pb-5 overflow-hidden flex flex-col items-center">
              {/* Cover Image Banner */}
              <Box 
                className="w-full h-40 relative z-0"
                sx={{ 
                  backgroundImage: `url(${siteConfig.coverImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 100%)',
                  }
                }}
              />
              
              <Box className="relative z-10 -mt-20 mb-6 px-8 flex flex-col items-center w-full">
                <Avatar 
                  src={emp.profilePicture ? `${SERVER_BASE}${emp.profilePicture}` : undefined}
                  sx={{ 
                    width: 160, 
                    height: 160, 
                    border: '8px solid var(--glass-card-bg)',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    bgcolor: siteConfig.colors.primary,
                    color: 'white',
                    fontSize: '3rem',
                    fontWeight: 900
                  }}
                >
                  {emp.firstName?.[0]}
                </Avatar>
                <Box 
                  className="absolute bottom-2 right-[30%] w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-lg"
                  sx={{ bgcolor: currentRole.color, color: 'white' }}
                >
                  {currentRole.icon}
                </Box>
              </Box>

              <Typography variant="h4" className="font-black mb-1" sx={{ color: 'var(--text-heading)' }}>
                {emp.firstName} {emp.lastName}
              </Typography>
              <Typography variant="body2" className="text-slate-400 font-bold uppercase tracking-widest mb-4">
                {emp.jobTitle?.replace(/_/g, ' ')}
              </Typography>

              <Chip 
                label={currentRole.label} 
                sx={{ 
                  bgcolor: `${siteConfig.colors.primary}10`, 
                  color: siteConfig.colors.primary, 
                  fontWeight: 800,
                  borderRadius: '10px',
                  mb: 1
                }} 
              />
             <Chip 
                              label={emp.department?.replace(/_/g, ' ')} 
                              sx={{ 
                                bgcolor: `${siteConfig.colors.primary}10`, 
                                color: siteConfig.colors.primary, 
                                fontWeight: 800,
                                borderRadius: '10px',
                                mb: 2
                              }} 
                            />

              <Divider sx={{ mb: 1, opacity: 0.5 }} />

              <Stack spacing={3} className="text-left">
                <Box className="flex items-center gap-4">
                  <Box className="p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-500/20" sx={{ bgcolor: `${siteConfig.colors.primary}10` }}>
                    <FingerprintIcon sx={{ color: siteConfig.colors.primary, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-slate-400 font-bold uppercase block">Employee ID</Typography>
                    <Typography variant="body2" className="font-black font-mono tracking-wider">{emp.employeeNo}</Typography>
                  </Box>
                </Box>
                <Box className="flex items-center gap-4">
                  <Box className="p-2.5 rounded-xl border border-purple-100 dark:border-purple-500/20" sx={{ bgcolor: `${siteConfig.colors.secondary}10` }}>
                    <MailOutlineIcon sx={{ color: siteConfig.colors.secondary, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-slate-400 font-bold uppercase block">Official Email</Typography>
                    <Typography variant="body2" className="font-bold truncate max-w-[200px]">{emp.email}</Typography>
                  </Box>
                </Box>
                <Box className="flex items-center gap-4">
                  <Box className="p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-500/20" sx={{ bgcolor: `#10b98110` }}>
                    <PhoneOutlinedIcon sx={{ color: '#10b981', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" className="text-slate-400 font-bold uppercase block"> Mobile Number</Typography>
                    <Typography variant="body2" className="font-bold">{emp.mobileNo}</Typography>
                  </Box>
                </Box>
              </Stack>
            </Paper>
          </motion.div>
        </Box>

        {/* Right Panel: Functional Clusters */}
        <Box className="flex-1 w-full space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Paper className="glass-card p-8 rounded-[3rem]">
              <SectionHeader icon={<WorkHistoryIcon />} title="Professional Details" />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<CalendarMonthOutlinedIcon />} label="Official Enrolment" value={formatDate(emp.dateJoined)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="Employee Type" value={emp.employeeType?.replace(/_/g, ' ')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BusinessOutlinedIcon />} label=" Grade" value={emp.grade} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<WorkspacePremiumIcon />} label="Job Category" value={emp.jobCategory?.replace(/_/g, ' ')} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="EPF Number" value={emp.epfNo} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<FingerprintIcon />} label="Fingerprint ID" value={emp.fingerPrintId} />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Paper className="glass-card p-8 rounded-[3rem]">
              <SectionHeader icon={<BadgeOutlinedIcon />} title="Personal Details" />
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="NIC Number" value={emp.nicNo} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<CalendarMonthOutlinedIcon />} label=" Birthday" value={formatDate(emp.dob)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="Gender Identity" value={emp.gender} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="Marital Status" value={emp.maritalStatus} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<LocationOnOutlinedIcon />} label="Resident District" value={emp.district} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <InfoRow icon={<BadgeOutlinedIcon />} label="Nationality" value={emp.nationality} />
                </Grid>
                <Grid item xs={12}>
                  <InfoRow icon={<LocationOnOutlinedIcon />} label="Primary Residential Address" value={emp.address} />
                </Grid>
              </Grid>
            </Paper>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Paper className="glass-card p-8 rounded-[3rem]">
              <SectionHeader icon={<SchoolOutlinedIcon />} title="Academic & Professional Qualifications" />
              <Box className="flex flex-wrap gap-3 mt-2">
                {Array.isArray(emp.qualifications) && emp.qualifications.length > 0 ? emp.qualifications.map((q, idx) => (
                  <Chip 
                    key={q}
                    label={q.replace(/_/g, ' ')} 
                    sx={{ 
                      fontWeight: 800, 
                      bgcolor: 'white', 
                      color: siteConfig.colors.secondary, 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      px: 1,
                      py: 2.5,
                      shadow: 1,
                      '&:hover': { transform: 'translateY(-2px)' }
                    }} 
                  />
                )) : (
                  <Typography variant="body2" className="text-slate-400 font-medium  p-6 rounded-2xl w-full text-center border border-dashed border-slate-200">
                    Update your local records with system administrator to add certifications.
                  </Typography>
                )}
              </Box>
            </Paper>
          </motion.div>

          {/* Security & Access */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Paper className="glass-card p-8 rounded-[3rem]">
              <SectionHeader icon={<LockOutlinedIcon />} title="Security & Credentials" />
              <Typography variant="body2" className="text-slate-400 mb-6 font-medium">
                Ensure your account remains protected by maintaining a robust password.
              </Typography>

              <form onSubmit={handleSubmit(onPasswordSubmit)}>
                <Stack spacing={3}>
                  <Controller
                    name="currentPassword"
                    control={control}
                    rules={{ required: 'Verification requires your current password' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type={showCurrent ? 'text' : 'password'}
                        label="Current Password"
                        fullWidth
                        error={!!errors.currentPassword}
                        helperText={errors.currentPassword?.message}
                        slotProps={{
                          input: {
                            sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowCurrent(!showCurrent)} edge="end">
                                  {showCurrent ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          }
                        }}
                      />
                    )}
                  />
                  
                  <Controller
                    name="newPassword"
                    control={control}
                    rules={{ 
                      required: 'Selection of a new password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters required' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type={showNew ? 'text' : 'password'}
                        label="New Password"
                        fullWidth
                        error={!!errors.newPassword}
                        helperText={errors.newPassword?.message}
                        slotProps={{ 
                          input: { 
                            sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowNew(!showNew)} edge="end">
                                  {showNew ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          } 
                        }}
                      />
                    )}
                  />
                  
                  <Controller
                    name="confirmPassword"
                    control={control}
                    rules={{ 
                      required: 'Please confirm your new password',
                      validate: value => value === newPassword || 'Credential mismatch: Passwords do not match'
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type={showConfirm ? 'text' : 'password'}
                        label="Confirm New Password"
                        fullWidth
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword?.message}
                        slotProps={{ 
                          input: { 
                            sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' },
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end">
                                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            )
                          } 
                        }}
                      />
                    )}
                  />

                  <Box>
                    {passError && <Alert severity="error" className="mb-4 rounded-xl">{passError}</Alert>}
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={isChanging}
                      fullWidth
                      startIcon={isChanging ? <CircularProgress size={20} color="inherit" /> : <CheckCircleOutlineIcon />}
                      sx={{ 
                        borderRadius: '15px', 
                        py: 1.8, 
                        textTransform: 'none', 
                        fontWeight: 800,
                        bgcolor: siteConfig.colors.primary,
                        '&:hover': { bgcolor: siteConfig.colors.secondary }
                      }}
                    >
                      {isChanging ? 'Synchronizing...' : 'Update Password'}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>
          </motion.div>
        </Box>
      </Box>

      <Snackbar
        open={passSuccess}
        autoHideDuration={4000}
        onClose={() => setPassSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" className="rounded-2xl shadow-lg border border-white/20">
          Security Synchronized: Password updated successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyProfilePage;
