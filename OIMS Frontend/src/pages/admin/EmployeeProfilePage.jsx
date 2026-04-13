import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployeeById, deleteEmployee } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, CircularProgress, Avatar, Chip, IconButton,
  Button, Grid, Divider, Alert, Dialog, DialogTitle, DialogContent, DialogActions,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
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
import { motion } from 'framer-motion';
import useAuthStore from '../../store/useAuthStore';

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

const EmployeeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [delOpen, setDelOpen] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getEmployeeById(id);
        setEmployee(res.data.data.employee);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <Box className="h-[60vh] flex flex-col justify-center items-center gap-4">
      <CircularProgress thickness={5} size={60} sx={{ color: siteConfig.colors.primary }} />
      <Typography variant="body2" className="text-slate-400 font-bold animate-pulse">Retrieving Resource...</Typography>
    </Box>
  );

  if (!employee) return (
    <Box className="p-10">
      <Alert severity="error" variant="filled" className="rounded-2xl" action={<Button color="inherit" onClick={() => navigate('/employees')}>Back to Directory</Button>}>
        Resource could not be located in the institutional database.
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
      {/* Top Functional Header */}
      <Box className="flex items-center justify-between mb-10">
        <Box className="flex items-center gap-4">
          <IconButton 
            onClick={() => navigate(-1)} 
            sx={{ bgcolor: 'white', '&:hover': { bgcolor: '#f1f5f9' }, p: 1.2, shadow: 1 }}
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <Box>
            <Typography variant="h5" className="font-black tracking-tight leading-none" sx={{ color: 'var(--text-heading)' }}>
              Profile <span style={{ color: siteConfig.colors.primary }}>Details</span>
            </Typography>
            <Typography variant="caption" className="text-slate-400 font-bold uppercase tracking-widest" sx={{ fontSize: '0.6rem' }}>
              Management System • Verified Identity
            </Typography>
          </Box>
        </Box>
        <Box className="flex gap-2">
          {/* Action buttons moved to sticky card */}
        </Box>
      </Box>

      {/* Main Dual-Panel Layout (Flex-based for stable sticky support) */}
      <Box className="flex flex-col lg:flex-row items-start gap-10">
        
        {/* Left Panel: Sticky Executive Profile Card */}
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
                  
                }} 
              />

              <Divider sx={{ mb: 1, opacity: 1 }} />

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

              {isAdmin && (
                <Box className="mt-8 px-8 w-full flex  gap-3">
                  <Button 
                    fullWidth
                    onClick={() => navigate(`/employees/edit/${id}`)}
                    variant="contained"
                    startIcon={<EditOutlinedIcon />}
                    className="btn-premium"
                    sx={{ 
                      borderRadius: '15px', 
                      textTransform: 'none', 
                      fontWeight: 800, 
                      py: 1.5
                    }}
                  >
                    Edit  
                  </Button>
                  <Button 
                    fullWidth
                    onClick={() => setDelOpen(true)}
                    variant="outlined"
                    startIcon={<DeleteOutlineIcon />}
                    sx={{ 
                      borderRadius: '15px', 
                      textTransform: 'none', 
                      fontWeight: 800, 
                      py: 1.5,
                      borderColor: '#fee2e2',
                      color: '#ef4444',
                      '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' }
                    }}
                  >
                    Delete 
                  </Button>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Box>

        {/* Right Panel: Scrollable Detail Clusters */}
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

          {/* Academic Qualifications */}
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
                      color: siteConfig.colors.primary, 
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      px: 1,
                      py: 2.5,
                      shadow: 1,
                      '&:hover': { transform: 'translateY(-2px)', shadow: 2 }
                    }} 
                  />
                )) : (
                  <Typography variant="body2" className="text-slate-400 font-medium  p-6 rounded-2xl w-full text-center border border-dashed border-slate-200">
                    No certified qualifications recorded in the system.
                  </Typography>
                )}
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>

      {/* Delete Dialog */}
      <Dialog 
        open={delOpen} 
        onClose={() => setDelOpen(false)} 
        slotProps={{ 
          backdrop: { 
            sx: { 
              backdropFilter: 'blur(8px)', 
              backgroundColor: 'rgba(15, 23, 42, 0.4)' 
            } 
          } 
        }}
        PaperProps={{ 
          sx: { 
            borderRadius: '32px', 
            p: 2,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            bgcolor: 'var(--bg-main)', // Solid background
            backgroundImage: 'none' // Remove any MUI overlays
          } 
        }}
      >
        <DialogTitle className="font-black text-2xl" sx={{ color: '#ef4444' }}>Delete Employee</DialogTitle>
        <DialogContent>
          <Typography className=" font-medium">
            Permanently Delete <strong>{emp.firstName} {emp.lastName}</strong> from the institutional directory? This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 4 }}>
          <Button onClick={() => setDelOpen(false)} sx={{ fontWeight: 800, color: '#64748b' }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={async () => { await deleteEmployee(id); navigate('/employees'); }}
            sx={{ borderRadius: '15px', fontWeight: 800, bgcolor: '#ef4444' }}
          >
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeProfilePage;
