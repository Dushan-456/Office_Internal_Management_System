import React, { useState, useEffect, useRef } from 'react';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { leaveApi } from '../../api/leaveApi';
import api from '../../api/axiosClient';
import { getEnums } from '../../api/employeeApi';
import useAuthStore from '../../store/useAuthStore';
import { siteConfig } from '../../config/siteConfig';
import {
  Box, Typography, Paper, TextField, MenuItem, Button,
  CircularProgress, Alert, Snackbar, IconButton, InputAdornment
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';



const LeaveApplicationForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const fileInputRef = useRef(null);
  
  const editData = location.state?.requestData;
  const isEditMode = !!editData;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [directory, setDirectory] = useState([]);
  const [enums, setEnums] = useState(null);
  const [attachmentFiles, setAttachmentFiles] = useState([]);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      leaveType: editData?.leaveType || '',
      category: editData?.category || 'Full Day',
      fromDate: editData?.dateRange?.from ? new Date(editData.dateRange.from).toISOString().split('T')[0] : '',
      toDate: editData?.dateRange?.to ? new Date(editData.dateRange.to).toISOString().split('T')[0] : '',
      addressWhileOnLeave: editData?.addressWhileOnLeave || '',
      reason: editData?.reason || '',
      actingOfficerId: editData?.actingOfficerId?.id || editData?.actingOfficerId || '',
      approveOfficerId: editData?.approveOfficerId?.id || editData?.approveOfficerId || '',
    }
  });

  const watchFromDate = watch('fromDate');
  const watchToDate = watch('toDate');
  const watchCategory = watch('category');

  // Auto calculate total days excluding weekends
  const calculateTotalDays = (fromStr, toStr) => {
    if (!fromStr || !toStr) return 0;
    
    // Split and parse locally to avoid timezone truncation jumps
    const [fy, fm, fd] = fromStr.split('-').map(Number);
    const [ty, tm, td] = toStr.split('-').map(Number);
    
    // Notice: month is 0-indexed in JS dates
    const curDate = new Date(fy, fm - 1, fd);
    const endDate = new Date(ty, tm - 1, td);
    
    if (isNaN(curDate) || isNaN(endDate)) return 0;
    if (endDate < curDate) return 0;

    let count = 0;
    while (curDate <= endDate) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (watchCategory === 'Half Day') {
      setTotalDays(0.5);
    } else {
      setTotalDays(calculateTotalDays(watchFromDate, watchToDate));
    }
  }, [watchFromDate, watchToDate, watchCategory]);

  useEffect(() => {
    const fetchDirectoryAndEnums = async () => {
      try {
        const [dirRes, enumRes] = await Promise.all([
          api.get('/employees/directory'),
          getEnums()
        ]);
        if (dirRes.data && dirRes.data.success) {
          setDirectory(dirRes.data.data);
        }
        if (enumRes.data && enumRes.data.success) {
          setEnums(enumRes.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      }
    };
    fetchDirectoryAndEnums();
  }, []);

  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setAttachmentFiles(prev => {
        const combined = [...prev, ...files];
        return combined.slice(0, 5); // Max 5 files
      });
    }
    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      setAttachmentFiles(prev => {
        const combined = [...prev, ...files];
        return combined.slice(0, 5); // Max 5 files
      });
    }
  };

  const getMinAllowedDate = () => {
    const gracePeriod = enums?.gracePeriodDays;
    if (gracePeriod === 0) return undefined; // No limit
    
    const d = new Date();
    d.setDate(d.getDate() - (gracePeriod || 7));
    return d.toISOString().split('T')[0];
  };

  const onSubmit = async (formData) => {
    setIsSubmitting(true);
    setApiError(null);

    const submitData = new FormData();
    submitData.append('leaveType', formData.leaveType);
    submitData.append('category', formData.category);
    submitData.append('fromDate', formData.fromDate);
    submitData.append('toDate', formData.toDate);
    submitData.append('addressWhileOnLeave', formData.addressWhileOnLeave);
    submitData.append('reason', formData.reason);
    submitData.append('actingOfficerId', formData.actingOfficerId);
    submitData.append('approveOfficerId', formData.approveOfficerId);
    attachmentFiles.forEach((file) => {
      submitData.append('attachments', file);
    });

    try {
      if (isEditMode) {
        await leaveApi.updateLeave(editData.id, submitData);
      } else {
        await leaveApi.applyLeave(submitData);
      }
      setSuccess(true);
      window.dispatchEvent(new CustomEvent('refreshPendingCounts'));
      setTimeout(() => {
        navigate(isEditMode ? '/leaves/my-details' : '/leaves/my-details');
      }, 1500);
    } catch (err) {
      const msgs = err.response?.data?.errors?.map(e => e.msg).join(', ');
      setApiError(msgs || err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'submit'} leave application`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamic Officer Filtering based on Role
  let actingOfficers = [];
  let approveOfficers = [];

  if (user?.role === 'TOP_ADMIN') {
    // TOP_ADMIN Case: Acting and Approve must be other TOP_ADMINs
    actingOfficers = directory.filter(u => u.role === 'TOP_ADMIN' && u.id !== user?.id);
    approveOfficers = directory.filter(u => u.role === 'TOP_ADMIN' && u.id !== user?.id);
  } else if (user?.role === 'DEPT_HEAD') {
    // DEPT_HEAD Case: Acting must be other DEPT_HEADs, Approve must be TOP_ADMINs
    actingOfficers = directory.filter(u => u.role === 'DEPT_HEAD' && u.id !== user?.id);
    approveOfficers = directory.filter(u => u.role === 'TOP_ADMIN');
  } else {
    // Default / EMPLOYEE / ADMIN Case: Acting is same dept employee, Approve is DEPT_HEAD OR TOP_ADMIN
    actingOfficers = directory.filter(u => u.department === user?.department && u.id !== user?.id && (u.role === 'EMPLOYEE' || u.role === 'ADMIN'));
    approveOfficers = directory.filter(u => u.role === 'DEPT_HEAD' || u.role === 'TOP_ADMIN');
  }

  if (!enums) {
    return <Box className="flex justify-center items-center h-96"><CircularProgress /></Box>;
  }

  return (
    <Box className="max-w-5xl mx-auto px-1">
      <Box className="flex items-center gap-3 mb-6 md:mb-8">
        <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'white', shadow: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="font-black tracking-tight" sx={{ color: 'var(--text-heading)' }}>
          {isEditMode ? 'Edit' : 'Apply'} <span style={{ color: siteConfig.colors.primary }}>Leave</span>
        </Typography>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        
        <Box className="space-y-6 md:space-y-8">
          <div className='md:flex gap-5'>
          
          <Paper className="glass-card p-5 md:p-8 mt-2 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
              Applicant Details
            </Typography><br />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <TextField 
                label="Name" 
                value={user ? `${user.firstName} ${user.lastName}` : ''} 
                fullWidth 
                variant="outlined" 
                disabled
                InputProps={{ readOnly: true }}
                slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} 
              />
              <TextField 
                label="Department" 
                value={user ? user.department : ''} 
                fullWidth 
                variant="outlined" 
                InputProps={{ readOnly: true }}
                disabled
                slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} 
              />
                <Controller
                name="reason"
                control={control}
                rules={{ required: 'Reason for leave is required' }}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Reason for Leave *" 
                    fullWidth 
                    multiline 
                    rows={5} 
                    className="md:col-span-2" 
                    error={!!errors.reason} 
                    helperText={errors.reason?.message} 
                    slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} 
                  />
                )}
              />
            </Box>
          </Paper>

          <Paper className="glass-card p-5 md:p-8 mt-2 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.secondary }} />
              Leave Requirements
            </Typography><br />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
              <Controller
                name="leaveType"
                control={control}
                rules={{ required: 'Leave Type is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Leave Type *" fullWidth select error={!!errors.leaveType} helperText={errors.leaveType?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.leaveTypes?.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="category"
                control={control}
                rules={{ required: 'Category is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Category *" fullWidth select error={!!errors.category} helperText={errors.category?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {enums.leaveCategories?.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </TextField>
                )}
              />
              <Controller
                name="fromDate"
                control={control}
                rules={{ 
                  required: 'From Date is required',
                }}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="From Date *" 
                    type="date" 
                    fullWidth 
                    error={!!errors.fromDate} 
                    helperText={errors.fromDate?.message} 
                    inputProps={{ min: getMinAllowedDate() }}
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch (err) {}
                    }}
                    slotProps={{ 
                      inputLabel: { shrink: true }, 
                      input: { 
                        sx: { 
                          borderRadius: '15px', 
                          bgcolor: 'var(--input-bg)',
                          cursor: 'pointer',
                          '&::-webkit-calendar-picker-indicator': {
                            cursor: 'pointer',
                            opacity: 0,
                            position: 'absolute',
                            right: 15,
                            width: '40px',
                            height: '100%'
                          }
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarMonthIcon sx={{ color: siteConfig.colors.primary, opacity: 0.8 }} />
                          </InputAdornment>
                        )
                      } 
                    }} 
                  />
                )}
              />
              <Controller
                name="toDate"
                control={control}
                rules={{ 
                  required: 'To Date is required',
                  validate: value => {
                    if (new Date(value) < new Date(watchFromDate)) return "To Date cannot be before From Date";
                    return true;
                  }
                }}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="To Date *" 
                    type="date" 
                    fullWidth 
                    error={!!errors.toDate} 
                    helperText={errors.toDate?.message} 
                    inputProps={{ min: watchFromDate || getMinAllowedDate() }}
                    onClick={(e) => {
                      try { e.target.showPicker(); } catch (err) {}
                    }}
                    slotProps={{ 
                      inputLabel: { shrink: true }, 
                      input: { 
                        sx: { 
                          borderRadius: '15px', 
                          bgcolor: 'var(--input-bg)',
                          cursor: 'pointer',
                          '&::-webkit-calendar-picker-indicator': {
                            cursor: 'pointer',
                            opacity: 0,
                            position: 'absolute',
                            right: 15,
                            width: '40px',
                            height: '100%'
                          }
                        },
                        endAdornment: (
                          <InputAdornment position="end">
                            <CalendarMonthIcon sx={{ color: siteConfig.colors.primary, opacity: 0.8 }} />
                          </InputAdornment>
                        )
                      } 
                    }} 
                  />
                )}
              />
         
              
            </Box>
              <TextField 
                label={`Total Days (excluding weekends)`}
                value={totalDays} 
                fullWidth 
                disabled
                variant="outlined" 
                InputProps={{ readOnly: true }}
                slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} 
              />
          </Paper>
        </div>

          <Paper className="glass-card p-5 md:p-8 rounded-[2rem]">
            <Typography variant="h6" className="font-bold mb-6 flex items-center gap-2" sx={{ color: 'var(--text-heading)', fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              <Box className="w-2 h-6 rounded-full" style={{ backgroundColor: siteConfig.colors.accent }} />
              Acting & Approval
            </Typography><br />
            <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <Controller
                name="actingOfficerId"
                control={control}
                rules={{ required: 'Acting Officer is required' }}
                render={({ field }) => (
                  <TextField {...field} label="Acting Officer *" fullWidth select error={!!errors.actingOfficerId} helperText={errors.actingOfficerId?.message} slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}>
                    {actingOfficers.length > 0 ? (
                      actingOfficers.map((u) => <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</MenuItem>)
                    ) : (
                      <MenuItem disabled value="">No available officers in department</MenuItem>
                    )}
                  </TextField>
                )}
              />
              <Controller
                name="approveOfficerId"
                control={control}
                rules={{ required: 'Approving Officer is required' }}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label={`Approving Officer (${user?.role === 'EMPLOYEE' || user?.role === 'ADMIN' ? 'Dept Head' : 'Top Administrative'}) *`} 
                    fullWidth 
                    select 
                    error={!!errors.approveOfficerId} 
                    helperText={errors.approveOfficerId?.message} 
                    slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }}
                  >
                    {approveOfficers.length > 0 ? (
                      approveOfficers.map((u) => <MenuItem key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.department || 'Management'})</MenuItem>)
                    ) : (
                      <MenuItem disabled value="">No authorized officers found</MenuItem>
                    )}
                  </TextField>
                )}
              />
              <Controller
                name="addressWhileOnLeave"
                control={control}
                rules={{ required: 'Address while on leave is required' }}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Address While On Leave *" 
                    fullWidth 
                    multiline 
                    rows={2} 
                    className="md:col-span-2" 
                    error={!!errors.addressWhileOnLeave} 
                    helperText={errors.addressWhileOnLeave?.message} 
                    slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)' } } }} 
                  />
                )}
              />
              <Box className="md:col-span-2">
                <Typography variant="body2" className="mb-2 font-medium" sx={{ color: 'var(--text-muted)' }}>Supporting Attachments (Optional — up to 5 files)</Typography><br />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                  id="attachment-file"
                  multiple
                />
                <Box
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragging ? siteConfig.colors.primary : '#e2e8f0',
                    borderRadius: '20px',
                    p: 4,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: isDragging ? 'rgba(99, 102, 241, 0.05)' : 'var(--input-bg)',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      borderColor: siteConfig.colors.primary,
                      bgcolor: 'rgba(99, 102, 241, 0.02)'
                    }
                  }}
                >
                  <AttachFileIcon sx={{ color: isDragging ? siteConfig.colors.primary : '#94a3b8', fontSize: 28, mb: 1 }} />
                  <Typography variant="body2" className="font-bold" sx={{ color: isDragging ? siteConfig.colors.primary : 'var(--text-muted)' }}>
                    {attachmentFiles.length >= 5 ? 'Maximum 5 files reached' : 'Drag and drop files here or click to browse'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94a3b8', mt: 0.5, display: 'block' }}>
                    {attachmentFiles.length} / 5 files selected • Max 10MB per file
                  </Typography>
                </Box>

                {/* Selected Files List */}
                {attachmentFiles.length > 0 && (
                  <Box className="mt-3 space-y-2">
                    {attachmentFiles.map((file, idx) => (
                      <Box 
                        key={idx} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          p: 1.5, 
                          borderRadius: '12px', 
                          bgcolor: 'rgba(99, 102, 241, 0.04)',
                          border: '1px solid rgba(99, 102, 241, 0.15)',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' }
                        }}
                      >
                        <Box className="flex items-center gap-2 overflow-hidden">
                          <AttachFileIcon sx={{ fontSize: 18, color: siteConfig.colors.primary }} />
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>
                            {(file.size / 1024).toFixed(0)} KB
                          </Typography>
                        </Box>
                        <IconButton 
                          size="small" 
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(idx); }}
                          sx={{ color: '#ef4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.08)' } }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
          </Paper>

          {apiError && <Alert severity="error" className="rounded-2xl shadow-sm">{apiError}</Alert>}

          <Box className="flex flex-col sm:flex-row justify-end gap-3 pb-20">
            <Button onClick={() => navigate(-1)} size="large" fullWidth  variant="contained" sx={{ py: 1.5, px: 6, borderRadius: '15px', textTransform: 'none', fontWeight: 800, background: '#f07373ff' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting} className="btn-premium" fullWidth sx={{ py: 1.5, px: 10, borderRadius: '15px', textTransform: 'none', fontWeight: 800 }}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Save Changes' : 'Submit Application')}
            </Button>
          </Box>
        </Box>
      </form>

      <Snackbar open={success} autoHideDuration={6000} onClose={() => setSuccess(false)}>
        <Alert severity="success" sx={{ width: '100%', borderRadius: '15px', fontWeight: 700 }}>{`Leave application ${isEditMode ? 'updated' : 'submitted'} successfully!`}</Alert>
      </Snackbar>
    </Box>
  );
};

export default LeaveApplicationForm;
