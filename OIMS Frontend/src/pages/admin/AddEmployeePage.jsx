import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { createEmployee, getEnums, bulkUploadEmployees } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  CircularProgress, Alert, Snackbar, Avatar, IconButton,
  FormGroup, FormControlLabel, Checkbox, Tabs, Tab,
  Divider, List, ListItem, ListItemText, ListItemIcon,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  CameraAlt as CameraAltIcon,
  Description as CsvIcon,
  Numbers as NumbersIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  FactCheck as ReferenceIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const qualificationsList = [
  'GCE_OL', 'GCE_AL', 'Diploma', 'Higher_Diploma',
  'Professional_Qualification', 'Degree', 'Masters', 'PHD'
];

const roleLabels = {
  ADMIN: 'System Administrator',
  TOP_ADMIN: 'Top Management',
  DEPT_HEAD: 'Department Head',
  EMPLOYEE: 'Staff Member',
};

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);
  
  // Tabs State
  const [activeTab, setActiveTab] = useState(0);

  // Manual Form State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [enums, setEnums] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  // Bulk Upload State
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const { control, handleSubmit, register, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      email: '', password: '', role: 'EMPLOYEE', employeeNo: '', epfNo: '', fingerPrintId: '',
      firstName: '', lastName: '', nicNo: '', dob: '', gender: '', maritalStatus: '',
      nationality: '', address: '', district: '', mobileNo: '',
      dateJoined: '', employeeType: '', department: '', jobCategory: '', jobTitle: '', grade: 'NA',
      qualifications: [],
    }
  });

  const watchedFirstName = watch('firstName');
  const watchedQuals = watch('qualifications');

  useEffect(() => {
    const fetchEnums = async () => {
      try {
        const res = await getEnums();
        setEnums(res.data.data);
      } catch (err) {
        console.error('Failed to fetch enums:', err);
      }
    };
    fetchEnums();
  }, []);

  const handleProfilePic = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'qualifications') data.append(key, JSON.stringify(value));
        else if (value !== null && value !== '') data.append(key, value);
      });
      if (profileFile) data.append('profilePicture', profileFile);

      await createEmployee(data);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setApiError(errData.errors.map(e => e.msg).join(', '));
      } else {
        setApiError(errData?.message || 'Failed to create employee');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvFile) return;
    setUploadLoading(true);
    setUploadResult(null);
    try {
      const res = await bulkUploadEmployees(csvFile);
      setUploadResult(res.data.data);
      setSuccess(true);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploadLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'firstName', 'lastName', 'email', 'employeeNo', 'epfNo', 'fingerPrintId', 'nicNo',
      'department', 'role', 'jobTitle', 'employeeType', 'jobCategory', 'grade',
      'password', 'dateJoined', 'dob', 'gender', 'maritalStatus', 'nationality', 'district', 'address', 'mobileNo'
    ].join(',');
    const sampleRow = [
      'Indika', 'Perera', 'indika@institution.com', 'EMP/2025/001', 'EPF/100', 'FP1024', '198500245V',
      '2', '4', '1', '5', '1', '1',
      '123456', '2025-01-01', '1985-05-15', 'Male', 'Married', 'Sri Lankan', 'Colombo', '123 Main St Colombo', '0771234567'
    ].join(',');
    
    const blob = new Blob([`${headers}\n${sampleRow}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCheckboxChange = (qual) => {
    const current = watchedQuals || [];
    const updated = current.includes(qual) ? current.filter((q) => q !== qual) : [...current, qual];
    setValue('qualifications', updated);
  };

  const formatLabel = (str) => str?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (!enums) {
    return <Box className="flex justify-center items-center h-96"><CircularProgress /></Box>;
  }

  const ReferenceSection = ({ title, items }) => (
    <Box className="mb-8">
      <Typography variant="subtitle2" className="font-bold flex items-center gap-2 mb-3" sx={{ color: siteConfig.colors.primary, opacity: 0.8 }}>
        <NumbersIcon fontSize="small" /> {title}
      </Typography>
      <Box className="grid grid-cols-1 gap-1">
        {items.map((item, idx) => (
          <Box key={item} className="flex justify-between items-center p-2 rounded-lg hover:bg-white transition-colors border border-dashed border-slate-200">
            <Typography variant="caption" className="font-bold">{item}</Typography>
            <Typography variant="caption" className="bg-slate-100 px-2 py-0.5 rounded font-black text-slate-600">ID: {idx + 1}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box className="max-w-6xl mx-auto px-1">
      <Box className="flex items-center gap-3 mb-6 md:mb-8">
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', shadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          Onboard <span style={{ color: siteConfig.colors.primary }}>Personnel</span>
        </Typography>
      </Box>

      {/* Mode Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={(_, v) => setActiveTab(v)}
        sx={{ 
          mb: 4, 
          '& .MuiTabs-indicator': { height: 4, borderRadius: '4px 4px 0 0' },
          borderBottom: '1px solid rgba(0,0,0,0.05)'
        }}
      >
        <Tab label="Manual Admission" className="font-bold" sx={{ textTransform: 'none', fontSize: '1rem', px: 4 }} />
        <Tab label="Bulk CSV Enrolment" className="font-bold" sx={{ textTransform: 'none', fontSize: '1rem', px: 4 }} />
      </Tabs>

      <AnimatePresence mode="wait">
        {activeTab === 0 ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            <form onSubmit={handleSubmit(onSubmit)}>
              <Box className="space-y-6 md:space-y-8 max-w-4xl">
                {/* Profile Section */}
                <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
                  <Box className="flex flex-col md:flex-row items-center gap-8">
                    <Box className="relative">
                      <Avatar src={profilePreview} sx={{ width: 120, height: 120, bgcolor: '#f1f5f9', border: '4px solid white', shadow: 2 }}>
                        {watchedFirstName?.[0] || 'U'}
                      </Avatar>
                      <IconButton 
                        size="small" 
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ position: 'absolute', bottom: 5, right: 5, bgcolor: siteConfig.colors.primary, color: 'white', '&:hover': { bgcolor: siteConfig.colors.secondary } }}
                      >
                        <CameraAltIcon fontSize="small" />
                      </IconButton>
                      <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleProfilePic} />
                    </Box>
                    <Box>
                      <Typography variant="h6" className="font-bold" sx={{ color: 'var(--text-heading)' }}>Employee Identity</Typography>
                      <Typography variant="body2" className="mb-4 max-w-sm font-medium" sx={{ color: 'var(--text-muted)' }}>Upload an official profile photograph for the corporate directory.</Typography>
                      <Button 
                        startIcon={<CloudUploadIcon />} 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outlined"
                        sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0' }}
                      >
                        Upload Photo
                      </Button>
                    </Box>
                  </Box>
                </Paper>

                {/* Core Identity */}
                <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
                  <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
                    <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
                    System Credentials
                  </Typography>
                  <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <Controller name="employeeNo" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Employee No *" fullWidth error={!!errors.employeeNo} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="epfNo" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="EPF No *" fullWidth error={!!errors.epfNo} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="fingerPrintId" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Fingerprint ID *" fullWidth error={!!errors.fingerPrintId} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="email" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Email *" fullWidth error={!!errors.email} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="password" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Initial Password *" type="password" fullWidth error={!!errors.password} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="role" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Role *" fullWidth select error={!!errors.role} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.roles.map((r) => <MenuItem key={r} value={r}>{roleLabels[r] || formatLabel(r)}</MenuItem>)}
                      </TextField>
                    )}/>
                  </Box>
                  <Typography variant="caption" className="block mt-4 text-slate-400 font-bold italic">Note: All new accounts are flagged for mandatory password change upon first login.</Typography>
                </Paper>

                {/* Personal Profile */}
                <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
                  <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
                    <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.secondary }} />
                    Personal Profile
                  </Typography>
                  <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <Controller name="firstName" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="First Name *" fullWidth error={!!errors.firstName} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="lastName" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Last Name *" fullWidth error={!!errors.lastName} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="nicNo" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="NIC Number *" fullWidth error={!!errors.nicNo} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="gender" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Gender *" fullWidth select error={!!errors.gender} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                      </TextField>
                    )}/>
                    <Controller name="dob" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Birth Date *" type="date" fullWidth error={!!errors.dob} slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="mobileNo" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Mobile No *" fullWidth error={!!errors.mobileNo} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="maritalStatus" control={control} render={({ field }) => (
                      <TextField {...field} label="Marital Status" fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        <MenuItem value="Single">Single</MenuItem><MenuItem value="Married">Married</MenuItem><MenuItem value="Divorced">Divorced</MenuItem><MenuItem value="Widowed">Widowed</MenuItem>
                      </TextField>
                    )}/>
                    <Controller name="nationality" control={control} render={({ field }) => <TextField {...field} label="Nationality" fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="district" control={control} render={({ field }) => <TextField {...field} label="District" fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="address" control={control} render={({ field }) => (
                      <TextField {...field} label="Residential Address" fullWidth multiline rows={2} className="md:col-span-2 lg:col-span-3" slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                    )}/>
                  </Box>
                </Paper>

                {/* Institutional Placement */}
                <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
                  <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
                    <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.accent }} />
                    Institutional Placement
                  </Typography>
                  <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    <Controller name="dateJoined" control={control} rules={{ required: 'Required' }} render={({ field }) => <TextField {...field} label="Enrolment Date *" type="date" fullWidth error={!!errors.dateJoined} slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />}/>
                    <Controller name="department" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Department *" fullWidth select error={!!errors.department} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.departments.map((d) => <MenuItem key={d} value={d}>{formatLabel(d)}</MenuItem>)}
                      </TextField>
                    )}/>
                    <Controller name="jobTitle" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Designation *" fullWidth select error={!!errors.jobTitle} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.jobTitles.map((j) => <MenuItem key={j} value={j}>{formatLabel(j)}</MenuItem>)}
                      </TextField>
                    )}/>
                    <Controller name="employeeType" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Contract Type *" fullWidth select error={!!errors.employeeType} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.employeeTypes.map((t) => <MenuItem key={t} value={t}>{formatLabel(t)}</MenuItem>)}
                      </TextField>
                    )}/>
                    <Controller name="jobCategory" control={control} rules={{ required: 'Required' }} render={({ field }) => (
                      <TextField {...field} label="Job Category *" fullWidth select error={!!errors.jobCategory} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.jobCategories.map((c) => <MenuItem key={c} value={c}>{formatLabel(c)}</MenuItem>)}
                      </TextField>
                    )}/>
                    <Controller name="grade" control={control} render={({ field }) => (
                      <TextField {...field} label="Grade" fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                        {enums.grades.map((g) => <MenuItem key={g} value={g}>{formatLabel(g)}</MenuItem>)}
                      </TextField>
                    )}/>
                  </Box>
                </Paper>

                {/* Qualifications */}
                <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
                  <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
                    <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
                    Academic & Professional Qualifications
                  </Typography>
                  <Box className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-1">
                    {qualificationsList.map((qual) => (
                      <FormControlLabel
                        key={qual}
                        control={
                          <Checkbox 
                            checked={watchedQuals?.includes(qual)} 
                            onChange={() => handleCheckboxChange(qual)}
                            sx={{ color: siteConfig.colors.primary, '&.Mui-checked': { color: siteConfig.colors.primary } }}
                          />
                        }
                        label={<Typography variant="body2" className="font-semibold uppercase tracking-tight" style={{ fontSize: '0.75rem' }}>{formatLabel(qual)}</Typography>}
                      />
                    ))}
                  </Box>
                </Paper>

                {apiError && <Alert severity="error" className="rounded-2xl shadow-sm">{apiError}</Alert>}

                <Box className="flex flex-col sm:flex-row justify-end gap-3 pb-20">
                  <Button onClick={() => navigate(-1)} size="large" fullWidth sx={{ py: 1.5, px: 6, borderRadius: '15px', textTransform: 'none', fontWeight: 800, color: '#64748b' }}>Cancel</Button>
                  <Button type="submit" variant="contained" disabled={isSubmitting} className="btn-premium" fullWidth sx={{ py: 1.5, px: 10, borderRadius: '15px', textTransform: 'none', fontWeight: 800 }}>
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Finalize Admission'}
                  </Button>
                </Box>
              </Box>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="bulk"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Box className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Upload Console */}
              <Box className="lg:col-span-2">
                <Paper className="glass-card p-8 md:p-12 rounded-[2.5rem] text-center border-2 border-dashed border-slate-200">
                  <AnimatePresence mode="wait">
                    {!uploadResult ? (
                      <motion.div key="upload-zone" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Box sx={{ bgcolor: `${siteConfig.colors.primary}10`, p: 6, borderRadius: '2rem', mb: 4 }} className="inline-block">
                          <CsvIcon sx={{ fontSize: 80, color: siteConfig.colors.primary }} />
                        </Box>
                        <Typography variant="h5" className="font-black mb-2">CSV Import Engine</Typography>
                        <Typography variant="body2" className="text-slate-400 mb-8 max-w-sm mx-auto font-medium">
                          Securely upload the institutional recruitment file. Use our numeric mapping system for guaranteed precision.
                        </Typography>
                        
                        <input
                          type="file"
                          accept=".csv"
                          ref={csvInputRef}
                          hidden
                          onChange={(e) => setCsvFile(e.target.files?.[0])}
                        />

                        {csvFile ? (
                          <Box className="bg-green-100 p-4 rounded-2xl mb-6 flex items-center justify-between border border-slate-200">
                            <Box className="flex items-center gap-3">
                              <InfoIcon className="text-indigo-400" />
                              <Typography className="font-bold text-slate-700">{csvFile.name}</Typography>
                            </Box>
                            <IconButton onClick={() => setCsvFile(null)} size="small" className="text-red"><ErrorIcon /></IconButton>
                          </Box>
                        ) : (
                          <Button 
                            variant="outlined" 
                            startIcon={<CloudUploadIcon />}
                            onClick={() => csvInputRef.current?.click()}
                            sx={{ py: 2, px: 6, borderRadius: '15px', mb: 2, fontWeight: 700 }}
                          >
                            Select CSV File
                          </Button>
                        )}
                        
                        <Box className="flex justify-center gap-3">
                          <Button 
                            variant="contained" 
                            className="btn-premium"
                            disabled={!csvFile || uploadLoading}
                            onClick={handleBulkUpload}
                            sx={{ py: 2, px: 6, borderRadius: '15px', fontWeight: 800 }}
                          >
                            {uploadLoading ? <CircularProgress size={24} color="inherit" /> : 'Execute Import'}
                          </Button>
                          <Button 
                            variant="text" 
                            startIcon={<DownloadIcon />}
                            onClick={downloadTemplate}
                            sx={{ fontWeight: 800, color: siteConfig.colors.primary, borderRadius: '12px', border: `1px solid ${siteConfig.colors.primary}30`, px: 3 }}
                          >
                            Download Sample CSV
                          </Button>
                        </Box>
                      </motion.div>
                    ) : (
                      <motion.div key="upload-results" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Box className="text-center mb-10">
                          <SuccessIcon sx={{ fontSize: 60, color: '#10b981', mb: 2 }} />
                          <Typography variant="h5" className="font-black">Import Execution Detailed</Typography>
                          <Typography variant="body2" className="text-slate-400">{uploadResult.success} Admission(s) successful, {uploadResult.failed} Rejected.</Typography>
                        </Box>
                        
                        {uploadResult.errors.length > 0 && (
                          <Box className="text-left mb-8">
                            <Typography variant="subtitle2" className="font-black mb-3 text-rose-500 uppercase tracking-widest flex items-center gap-2">
                              <ErrorIcon fontSize="small" /> Execution Exceptions ({uploadResult.errors.length})
                            </Typography>
                            <Box 
                              className="bg-rose-50 p-4 rounded-2xl border border-rose-100 max-h-60 overflow-y-auto"
                            >
                              {uploadResult.errors.map((err, i) => (
                                <Typography key={i} variant="caption" className="block text-rose-700 font-bold mb-1">• {err}</Typography>
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Button 
                          variant="outlined" 
                          onClick={() => setUploadResult(null)}
                          sx={{ borderRadius: '12px', fontWeight: 800 }}
                        >
                          Reset Console
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Paper>
              </Box>

              {/* Right Column: Reference Guide */}
              <Box>
                <Paper className="glass-card p-6 md:p-8 rounded-[2.5rem] sticky top-8">
                  <Box className="flex items-center gap-3 mb-6">
                    <ReferenceIcon className="text-indigo-400" />
                    <Typography variant="h6" className="font-black">Identity Reference</Typography>
                  </Box>

                  <Alert severity="warning" sx={{ mb: 4, borderRadius: '15px', '& .MuiAlert-message': { width: '100%' } }}>
                    <Typography variant="caption" className="block font-black uppercase tracking-widest mb-1 text-amber-800">
                      Crucial: Chronological Data formatting
                    </Typography>
                    <Typography variant="body2" className="text-amber-500  leading-relaxed">
                      All date arrays (e.g. <strong>dob</strong>, <strong>dateJoined</strong>) within your CSV must be strictly encoded in <strong>YYYY-MM-DD</strong> format. Spreadsheets like Excel regularly scramble dates into localized formats (like MM/DD/YYYY). Failure to enforce standard ISO compliance will result in immediate row rejection.
                    </Typography>
                  </Alert>

                  <Divider className="mb-6" />
                  
                  <Box className="max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    <ReferenceSection title="Departments" items={enums.departments} />
                    <ReferenceSection title="Official Roles" items={enums.roles} />
                    <ReferenceSection title="Job Titles" items={enums.jobTitles} />
                    <ReferenceSection title="Employee Types" items={enums.employeeTypes} />
                    <ReferenceSection title="Job Categories" items={enums.jobCategories} />
                  </Box>

                  <Box className="mt-8 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
                    <Typography variant="caption" className="font-black text-indigo-600 uppercase tracking-widest block mb-1">PRO-TIP</Typography>
                    <Typography variant="caption" className="font-medium text-slate-500 leading-relaxed block">
                      Use the numeric IDs listed above in your CSV columns for 100% precision. The system also accepts exact string matches.
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: '15px', fontWeight: 700 }}>Personnel directory updated successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default AddEmployeePage;
