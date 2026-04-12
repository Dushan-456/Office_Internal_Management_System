import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployeeById, updateEmployee, getEnums } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  CircularProgress, Alert, Snackbar, Avatar, IconButton,
  FormGroup, FormControlLabel, Checkbox
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import { motion } from 'framer-motion';

const qualificationsList = [
  'GCE_OL', 'GCE_AL', 'Diploma', 'Higher_Diploma',
  'Professional_Qualification', 'Degree', 'Masters', 'PHD'
];

const EditEmployeePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [enums, setEnums] = useState(null);
  const [profilePreview, setProfilePreview] = useState(null);
  const [profileFile, setProfileFile] = useState(null);

  const [formData, setFormData] = useState({
    email: '', password: '', role: 'EMPLOYEE', employeeNo: '', epfNo: '', fingerPrintId: '',
    firstName: '', lastName: '', nicNo: '', dob: '', gender: '', maritalStatus: '',
    nationality: '', address: '', district: '', mobileNo: '',
    dateJoined: '', employeeType: '', department: '', jobCategory: '', jobTitle: '', grade: 'NA',
    qualifications: [],
  });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  const SERVER_BASE = API_BASE.replace('/api/v1', '');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enumRes, empRes] = await Promise.all([
          getEnums(),
          getEmployeeById(id)
        ]);
        
        setEnums(enumRes.data.data);
        
        const emp = empRes.data.data.employee;
        
        // Prepare form data from employee profile
        setFormData({
          email: emp.email || '',
          password: '', // Keep empty by default
          role: emp.role || 'EMPLOYEE',
          employeeNo: emp.employeeNo || '',
          epfNo: emp.epfNo || '',
          fingerPrintId: emp.fingerPrintId || '',
          firstName: emp.firstName || '',
          lastName: emp.lastName || '',
          nicNo: emp.nicNo || '',
          dob: emp.dob ? new Date(emp.dob).toISOString().split('T')[0] : '',
          gender: emp.gender || '',
          maritalStatus: emp.maritalStatus || '',
          nationality: emp.nationality || '',
          address: emp.address || '',
          district: emp.district || '',
          mobileNo: emp.mobileNo || '',
          dateJoined: emp.dateJoined ? new Date(emp.dateJoined).toISOString().split('T')[0] : '',
          employeeType: emp.employeeType || '',
          department: emp.department || '',
          jobCategory: emp.jobCategory || '',
          jobTitle: emp.jobTitle || '',
          grade: emp.grade || 'NA',
          qualifications: Array.isArray(emp.qualifications) ? emp.qualifications : [],
        });

        if (emp.profilePicture) {
          setProfilePreview(`${SERVER_BASE}${emp.profilePicture}`);
        }
      } catch (err) {
        setApiError(err.response?.data?.message || 'Failed to retrieve record');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, SERVER_BASE]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (qual) => {
    setFormData((prev) => {
      const current = prev.qualifications || [];
      const updated = current.includes(qual) ? current.filter((q) => q !== qual) : [...current, qual];
      return { ...prev, qualifications: updated };
    });
  };

  const handleProfilePic = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError(null);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        // Handle nested or array types
        if (key === 'qualifications') {
          data.append(key, JSON.stringify(value));
        } else if (key === 'password') {
          // Only append if not empty
          if (value.trim() !== '') data.append(key, value);
        } else {
          // Append everything else if not empty
          if (value !== null && value !== undefined) data.append(key, value);
        }
      });
      
      if (profileFile) {
        data.append('profilePicture', profileFile);
      }

      await updateEmployee(id, data);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setApiError(err.response?.data?.message || 'Update failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (str) => str?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (loading) {
    return (
      <Box className="flex flex-col justify-center items-center h-96 gap-4">
        <CircularProgress thickness={5} sx={{ color: siteConfig.colors.primary }} />
        <Typography variant="body2" className="text-slate-400 font-bold animate-pulse">Initializing Interface...</Typography>
      </Box>
    );
  }

  return (
    <Box className="max-w-4xl mx-auto">
      <Box className="flex items-center gap-4 mb-8">
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', shadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          Update <span style={{ color: siteConfig.colors.primary }}>Resource Record</span>
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box className="space-y-8">
          {apiError && <Alert severity="error" className="rounded-2xl shadow-sm">{apiError}</Alert>}
          
          {/* Profile Section */}
          <Paper className="glass-card p-8 rounded-[2rem]">
            <Box className="flex flex-col md:flex-row items-center gap-8">
              <Box className="relative">
                <Avatar src={profilePreview} sx={{ width: 120, height: 120, bgcolor: '#f1f5f9', border: '4px solid white', shadow: 2 }}>
                  {formData.firstName?.[0] || 'U'}
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
                <Typography variant="h6" className="font-bold" sx={{ color: 'var(--text-heading)' }}>Identity Modification</Typography>
                <Typography variant="body2" className="mb-4 max-w-sm font-medium" sx={{ color: 'var(--text-muted)' }}>Updating the profile photograph will overwrite existing archive data.</Typography>
                <Button 
                  startIcon={<CloudUploadIcon />} 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outlined"
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0' }}
                >
                  Change Profile Photo
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Core Identity */}
          <Paper className="glass-card p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
              System Credentials
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TextField name="employeeNo" label="Employee No *" value={formData.employeeNo} onChange={handleChange} fullWidth required slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="epfNo" label="EPF No" value={formData.epfNo} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="fingerPrintId" label="Fingerprint ID" value={formData.fingerPrintId} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="email" label="Email *" type="email" value={formData.email} onChange={handleChange} fullWidth required slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="password" label="New Password (optional)" type="password" placeholder="Leave blank to keep current" value={formData.password} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="role" label="Access Role" value={formData.role} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.roles.map((r) => <MenuItem key={r} value={r}>{formatLabel(r)}</MenuItem>)}
              </TextField>
            </Box>
          </Paper>

          {/* Personal Info */}
          <Paper className="glass-card p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.secondary }} />
              Personal Profile
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TextField name="firstName" label="First Name" value={formData.firstName} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="lastName" label="Last Name" value={formData.lastName} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="nicNo" label="NIC Number" value={formData.nicNo} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="gender" label="Gender" value={formData.gender} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                <MenuItem value="Male">Male</MenuItem><MenuItem value="Female">Female</MenuItem><MenuItem value="Other">Other</MenuItem>
              </TextField>
              <TextField name="dob" label="Date of Birth" type="date" value={formData.dob} onChange={handleChange} fullWidth slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="mobileNo" label="Mobile Connection" value={formData.mobileNo} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="maritalStatus" label="Marital Status" value={formData.maritalStatus} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                <MenuItem value="Single">Single</MenuItem><MenuItem value="Married">Married</MenuItem><MenuItem value="Divorced">Divorced</MenuItem><MenuItem value="Widowed">Widowed</MenuItem>
              </TextField>
              <TextField name="nationality" label="Nationality" value={formData.nationality} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="district" label="District" value={formData.district} onChange={handleChange} fullWidth slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="address" label="Residential Address" value={formData.address} onChange={handleChange} fullWidth multiline rows={2} className="md:col-span-2 lg:col-span-3" slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
            </Box>
          </Paper>

          {/* Employment Detail */}
          <Paper className="glass-card p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)' }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.accent }} />
              Institutional Placement
            </Typography>
            <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <TextField name="dateJoined" label="Enrolment Date" type="date" value={formData.dateJoined} onChange={handleChange} fullWidth slotProps={{ inputLabel: { shrink: true }, input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} />
              <TextField name="department" label="Department" value={formData.department} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.departments.map((d) => <MenuItem key={d} value={d}>{formatLabel(d)}</MenuItem>)}
              </TextField>
              <TextField name="jobCategory" label="Job Category" value={formData.jobCategory} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.jobCategories.map((c) => <MenuItem key={c} value={c}>{formatLabel(c)}</MenuItem>)}
              </TextField>
              <TextField name="jobTitle" label="Official Designation" value={formData.jobTitle} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.jobTitles.map((j) => <MenuItem key={j} value={j}>{formatLabel(j)}</MenuItem>)}
              </TextField>
              <TextField name="employeeType" label="Contract Type" value={formData.employeeType} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.employeeTypes.map((t) => <MenuItem key={t} value={t}>{formatLabel(t)}</MenuItem>)}
              </TextField>
              <TextField name="grade" label="Grade" value={formData.grade} onChange={handleChange} fullWidth select slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                {enums.grades.map((g) => <MenuItem key={g} value={g}>{formatLabel(g)}</MenuItem>)}
              </TextField>
            </Box>
          </Paper>

          {/* Qualifications */}
          <Paper className="glass-card p-8 rounded-[2rem]">
             <Typography variant="h6" className="font-bold mb-4" sx={{ color: 'var(--text-heading)' }}>Professional Qualifications</Typography>
             <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
               {qualificationsList.map((q) => (
                 <FormControlLabel
                   key={q}
                   control={<Checkbox checked={formData.qualifications.includes(q)} onChange={() => handleCheckboxChange(q)} size="small" />}
                   label={<Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{q.replace(/_/g, ' ')}</Typography>}
                 />
               ))}
             </Box>
          </Paper>

          <Box className="flex justify-end gap-3 pb-20">
            <Button onClick={() => navigate(-1)} size="large" sx={{ py: 1.5, px: 6, borderRadius: '15px', textTransform: 'none', fontWeight: 800, color: '#64748b' }}>Discard Changes</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} className="btn-premium" sx={{ py: 1.5, px: 10, borderRadius: '15px', textTransform: 'none', fontWeight: 800 }}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Synchronize Record'}
            </Button>
          </Box>
        </Box>
      </form>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: '15px', fontWeight: 700 }}>Record updated successfully!</Alert>
      </Snackbar>
    </Box>
  );
};

export default EditEmployeePage;
