import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { createEmployee, getEnums } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  CircularProgress, Alert, Snackbar, Avatar, IconButton,
  FormGroup, FormControlLabel, Checkbox, FormHelperText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { motion } from 'framer-motion';

const qualificationsList = [
  'GCE_OL', 'GCE_AL', 'Diploma', 'Higher_Diploma',
  'Professional_Qualification', 'Degree', 'Masters', 'PHD'
];

const roleLabels = {
  ADMIN: 'System Administrator',
  DEPT_HEAD: 'Department Head',
  EMPLOYEE: 'Staff Member',
};

const AddEmployeePage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [enums, setEnums] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

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
      
      // Redirect to All Employees after a short delay
      setTimeout(() => {
        navigate('/employees');
      }, 1500);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Box className="max-w-4xl mx-auto px-1">
      <Box className="flex items-center gap-3 mb-6 md:mb-8">
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', shadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          Register <span style={{ color: siteConfig.colors.primary }}>New Employee</span>
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Box className="space-y-6 md:space-y-8">
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
                <Typography variant="body2" className="mb-4 max-w-sm font-medium" sx={{ color: 'var(--text-muted)' }}>Upload an official profile photograph for the corporate directory and identification purposes.</Typography>
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
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
              System Credentials
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Controller
                name="employeeNo"
                control={control}
                rules={{ required: 'Employee Number is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Employee No *" fullWidth error={!!errors.employeeNo} helperText={errors.employeeNo?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="epfNo"
                control={control}
                rules={{ required: 'EPF Number is required' }}
                render={({ field }) => (
                  <TextField {...field} label="EPF No *" fullWidth error={!!errors.epfNo} helperText={errors.epfNo?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="fingerPrintId"
                control={control}
                rules={{ required: 'Fingerprint ID is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Fingerprint ID *" fullWidth error={!!errors.fingerPrintId} helperText={errors.fingerPrintId?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="email"
                control={control}
                rules={{ required: 'Email is required', pattern: { value: /^\S+@\S+$/i, message: 'Invalid email format' } }}
                render={({ field }) => (
                  <TextField {...field} label="Email *" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="password"
                control={control}
                rules={{ required: 'Password is required', minLength: { value: 6, message: 'Minimum 6 characters' } }}
                render={({ field }) => (
                  <TextField {...field} label="Password *" type="password" fullWidth error={!!errors.password} helperText={errors.password?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="role"
                control={control}
                rules={{ required: 'Access Role is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Access Role *" fullWidth select error={!!errors.role} helperText={errors.role?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.roles.map((r) => <MenuItem key={r} value={r}>{roleLabels[r] || formatLabel(r)}</MenuItem>)}
                  </TextField>
                )}
              />
            </Box>
          </Paper>

          {/* Personal Info */}
          <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.secondary }} />
              Personal Profile
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Controller
                name="firstName"
                control={control}
                rules={{ required: 'First Name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="First Name *" fullWidth error={!!errors.firstName} helperText={errors.firstName?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="lastName"
                control={control}
                rules={{ required: 'Last Name is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Last Name *" fullWidth error={!!errors.lastName} helperText={errors.lastName?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="nicNo"
                control={control}
                rules={{ required: 'NIC Number is required' }}
                render={({ field }) => (
                  <TextField {...field} label="NIC Number *" fullWidth error={!!errors.nicNo} helperText={errors.nicNo?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="gender"
                control={control}
                rules={{ required: 'Gender is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Gender *" fullWidth select error={!!errors.gender} helperText={errors.gender?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="dob"
                control={control}
                rules={{ required: 'Date of Birth is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Date of Birth *" type="date" fullWidth error={!!errors.dob} helperText={errors.dob?.message} slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="mobileNo"
                control={control}
                rules={{ required: 'Mobile Number is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Mobile Connection *" fullWidth error={!!errors.mobileNo} helperText={errors.mobileNo?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="maritalStatus"
                control={control}
                rules={{ required: 'Marital Status is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Marital Status *" fullWidth select error={!!errors.maritalStatus} helperText={errors.maritalStatus?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    <MenuItem value="Single">Single</MenuItem><MenuItem value="Married">Married</MenuItem><MenuItem value="Divorced">Divorced</MenuItem><MenuItem value="Widowed">Widowed</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="nationality"
                control={control}
                rules={{ required: 'Nationality is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Nationality *" fullWidth error={!!errors.nationality} helperText={errors.nationality?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="district"
                control={control}
                rules={{ required: 'District is required' }}
                render={({ field }) => (
                  <TextField {...field} label="District *" fullWidth error={!!errors.district} helperText={errors.district?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="address"
                control={control}
                rules={{ required: 'Address is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Residential Address *" fullWidth multiline rows={2} className="md:col-span-2 lg:col-span-3" error={!!errors.address} helperText={errors.address?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
            </Box>
          </Paper>

          {/* Employment Detail */}
          <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.accent }} />
              Institutional Placement
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <Controller
                name="dateJoined"
                control={control}
                rules={{ required: 'Enrolment Date is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Enrolment Date *" type="date" fullWidth error={!!errors.dateJoined} helperText={errors.dateJoined?.message} slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
                )}
              />
              <Controller
                name="department"
                control={control}
                rules={{ required: 'Department is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Department *" fullWidth select error={!!errors.department} helperText={errors.department?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.departments.map((d) => <MenuItem key={d} value={d}>{formatLabel(d)}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="jobCategory"
                control={control}
                rules={{ required: 'Job Category is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Job Category *" fullWidth select error={!!errors.jobCategory} helperText={errors.jobCategory?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.jobCategories.map((c) => <MenuItem key={c} value={c}>{formatLabel(c)}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="jobTitle"
                control={control}
                rules={{ required: 'Job Title is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Official Designation *" fullWidth select error={!!errors.jobTitle} helperText={errors.jobTitle?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.jobTitles.map((j) => <MenuItem key={j} value={j}>{formatLabel(j)}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="employeeType"
                control={control}
                rules={{ required: 'Contract Type is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Contract Type *" fullWidth select error={!!errors.employeeType} helperText={errors.employeeType?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.employeeTypes.map((t) => <MenuItem key={t} value={t}>{formatLabel(t)}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="grade"
                control={control}
                rules={{ required: 'Grade is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Grade *" fullWidth select error={!!errors.grade} helperText={errors.grade?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.grades.map((g) => <MenuItem key={g} value={g}>{formatLabel(g)}</MenuItem>)}
                  </TextField>
                )}
              />
            </Box>
          </Paper>

          {/* Academic Qualifications (Optional) */}
          <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
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
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Finalize Registration'}
            </Button>
          </Box>
        </Box>
      </form>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: '15px', fontWeight: 700 }}>Employee registered successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default AddEmployeePage;
