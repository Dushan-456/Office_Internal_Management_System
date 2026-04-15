import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import SyncIcon from '@mui/icons-material/Sync';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import VisibilityIcon from '@mui/icons-material/Visibility';
import api from '../../api/axiosClient';
import { siteConfig } from '../../config/siteConfig';

const SystemSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState(null);
  const [allocationYear, setAllocationYear] = useState(new Date().getFullYear());
  const [newLeaveType, setNewLeaveType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newReminder, setNewReminder] = useState({ dayOffset: 1, time: '08:00' });
  const [message, setMessage] = useState({ open: false, text: '', severity: 'success' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/settings');
      if (res.data.success) {
        setSettings(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      setMessage({ open: true, text: 'Failed to load system settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await api.patch('/settings', settings);
      if (res.data.success) {
        setSettings(res.data.data);
        setMessage({ open: true, text: 'Settings updated successfully', severity: 'success' });
      }
    } catch (err) {
      setMessage({ open: true, text: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAllocateLeaves = async () => {
    if (!window.confirm(`This will allocate ${settings.annualLeaveBalance} annual leaves for year ${allocationYear} to ALL employees. Existing allocations for this year will not be overwritten. Proceed?`)) return;
    try {
      setSyncing(true);
      const res = await api.post('/settings/allocate-yearly-leaves', { year: allocationYear });
      if (res.data.success) {
        setMessage({ open: true, text: res.data.message, severity: 'success' });
      }
    } catch (err) {
      setMessage({ open: true, text: 'Failed to allocate leaves', severity: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const handleRunTestReminders = async (dayOffset) => {
    try {
      setSyncing(true);
      const res = await api.post('/settings/test-reminders', { dayOffset: dayOffset || 0 });
      if (res.data.success) {
        setMessage({ open: true, text: res.data.message, severity: 'success' });
      }
    } catch (err) {
      setMessage({ open: true, text: 'Failed to trigger reminders', severity: 'error' });
    } finally {
      setSyncing(false);
    }
  };

  const addReminder = () => {
    const updated = {
      ...settings,
      leaveReminders: [
        ...(settings.leaveReminders || []),
        { ...newReminder, enabled: true, lastRunDate: '' }
      ]
    };
    setSettings(updated);
  };

  const removeReminder = (index) => {
    const updated = {
      ...settings,
      leaveReminders: settings.leaveReminders.filter((_, i) => i !== index)
    };
    setSettings(updated);
  };

  const toggleReminder = (index) => {
    const updated = {
      ...settings,
      leaveReminders: settings.leaveReminders.map((r, i) => 
        i === index ? { ...r, enabled: !r.enabled } : r
      )
    };
    setSettings(updated);
  };

  const addDept = () => {
    if (!newDept) return;
    setSettings({ 
      ...settings, 
      departments: [...(settings.departments || []), newDept] 
    });
    setNewDept('');
  };

  const removeDept = (dept) => {
    setSettings({ 
      ...settings, 
      departments: settings.departments.filter((d) => d !== dept) 
    });
  };

  const handleToggle = (path) => {
    const keys = path.split('.');
    const updated = { ...settings };
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = !current[keys[keys.length - 1]];
    setSettings(updated);
  };

  const addLeaveType = () => {
    if (!newLeaveType.trim()) return;
    if (settings.leaveTypes.includes(newLeaveType.trim())) return;
    setSettings({
      ...settings,
      leaveTypes: [...settings.leaveTypes, newLeaveType.trim()]
    });
    setNewLeaveType('');
  };

  const removeLeaveType = (type) => {
    setSettings({
      ...settings,
      leaveTypes: settings.leaveTypes.filter(t => t !== type)
    });
  };

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (settings.leaveCategories.includes(newCategory.trim())) return;
    setSettings({
      ...settings,
      leaveCategories: [...settings.leaveCategories, newCategory.trim()]
    });
    setNewCategory('');
  };

  const removeCategory = (cat) => {
    setSettings({
      ...settings,
      leaveCategories: settings.leaveCategories.filter(c => c !== cat)
    });
  };

  if (loading || !settings) {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress size={60} thickness={5} />
      </Box>
    );
  }

  return (
    <Box className="animate-in fade-in duration-700 px-1 md:px-4 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <Box className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Box>
          <Typography variant="h4" className="font-black tracking-tight flex items-center gap-3" sx={{ color: 'var(--text-heading)' }}>
            <SettingsSuggestIcon sx={{ fontSize: 40, color: siteConfig.colors.primary }} />
            System <span style={{ color: siteConfig.colors.primary }}>Settings</span>
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)', mt: 1, fontWeight: 500 }}>
            Configure global workflows, leave policies, and notification triggers.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          className="btn-premium"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ borderRadius: '16px', px: 4, py: 1.5, textTransform: 'none', fontWeight: 800 }}
        >
          Save All Configurations
        </Button>
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <Box className="space-y-8">
          {/* Core Policies */}
          <Paper className="glass-card p-8 rounded-[2rem] border-none">
            <Typography variant="h6" className="font-black mb-6 flex items-center gap-3" sx={{ color: 'var(--text-heading)' }}>
              <Box className="w-2 h-6 rounded-full" sx={{ bgcolor: siteConfig.colors.primary }} />
              Core Policies
            </Typography>
            <Box className="space-y-6">
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', mb: 2, display: 'block' }}>
                  ANNUAL LEAVE ALLOWANCE (DEFAULT)
                </Typography>
                <TextField
                  type="number"
                  value={settings.annualLeaveBalance}
                  onChange={(e) => setSettings({ ...settings, annualLeaveBalance: parseInt(e.target.value) })}
                  fullWidth
                  slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 } } }}
                  sx={{ mb: 4 }}
                />
                
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', mb: 2, display: 'block' }}>
                  ALLOCATE YEARLY LEAVES TO ALL EMPLOYEES
                </Typography>
                <Box className="flex items-center gap-4">
                  <TextField
                    type="number"
                    value={allocationYear}
                    onChange={(e) => setAllocationYear(parseInt(e.target.value))}
                    fullWidth
                    slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 } } }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={syncing ? <CircularProgress size={16} /> : <AddIcon />}
                    onClick={handleAllocateLeaves}
                    disabled={syncing}
                    sx={{ borderRadius: '15px', textTransform: 'none', height: '56px', border: '2px solid', px: 3, fontWeight: 700, minWidth: '170px' }}
                  >
                    Allocate Leaves
                  </Button>
                </Box>
                <Typography variant="caption" sx={{ color: siteConfig.colors.primary, mt: 1, display: 'block', fontWeight: 700 }}>
                  * Use this at the start of every year to grant new leaves to everyone without overwriting existing entries.
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem',  display: 'block' }}>
                  GRACE PERIOD (DAYS)
                </Typography>
                <TextField
                  type="number"
                  value={settings.gracePeriodDays}
                  onChange={(e) => setSettings({ ...settings, gracePeriodDays: parseInt(e.target.value) })}
                  fullWidth
                  slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 } } }}
                  helperText="Allowed days to apply for leave after the start date."
                  
                />
              </Box>

              <Divider sx={{ opacity: 0.6, mb: 1 }} />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem',  display: 'block' }}>
                  ATTENDANCE: LATE THRESHOLD (HH:mm)
                </Typography>
                <TextField
                  type="time"
                  value={settings.attendanceSettings?.lateThreshold || '08:30'}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    attendanceSettings: { 
                      ...(settings.attendanceSettings || {}), 
                      lateThreshold: e.target.value 
                    } 
                  })}
                  fullWidth
                  slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 } } }}
                  helperText="Employees checking in after this time will be marked as 'Late'."
                  sx={{ mb: 1 }}
                />

                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', mb: 2, display: 'block' }}>
                  ATTENDANCE: STANDARD WORK HOURS
                </Typography>
                <TextField
                  type="number"
                  value={settings.attendanceSettings?.standardWorkHours || 8}
                  onChange={(e) => setSettings({ 
                    ...settings, 
                    attendanceSettings: { 
                      ...(settings.attendanceSettings || {}), 
                      standardWorkHours: parseFloat(e.target.value) 
                    } 
                  })}
                  fullWidth
                  slotProps={{ input: { sx: { borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 } } }}
                  helperText="Expected working hours per day for analytics."
                />
              </Box>

              <Divider sx={{ opacity: 0.6, mb: 1 }} />

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', mb: 2, display: 'block' }}>
                  SYSTEM TIMEZONE
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={settings.timezone || 'Asia/Colombo'}
                    onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                    sx={{ borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 }}
                  >
                    {[
                      "Asia/Colombo", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", 
                      "Europe/London", "America/New_York", "UTC", "GMT"
                    ].map(tz => <MenuItem key={tz} value={tz}>{tz}</MenuItem>)}
                  </Select>
                </FormControl>
                <Typography variant="caption" sx={{ color: 'var(--text-muted)', mt: 1, display: 'block' }}>
                  Determines the "Today" range for dashboard leaves.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Leave Schema */}
          <Paper className="glass-card p-8 rounded-[2rem] border-none">
            <Typography variant="h6" className="font-black mb-6 flex items-center gap-3" sx={{ color: 'var(--text-heading)' }}>
              <Box className="w-2 h-6 rounded-full" sx={{ bgcolor: siteConfig.colors.secondary }} />
              Dynamic Schema
            </Typography>
            
            <Box className="space-y-8">
              {/* Leave Types */}
              <Box>
                <Typography variant="subtitle2" className="font-bold mb-3" sx={{ color: 'var(--text-heading)' }}>Leave Types</Typography>
                <Box className="flex flex-wrap gap-2 mb-4">
                  <AnimatePresence>
                    {settings.leaveTypes.map((type) => (
                      <motion.div key={type} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Chip
                          label={type}
                          onDelete={() => removeLeaveType(type)}
                          sx={{ 
                            borderRadius: '10px', 
                            fontWeight: 700,
                            bgcolor: `${siteConfig.colors.primary}10`,
                            color: siteConfig.colors.primary,
                            border: `1px solid ${siteConfig.colors.primary}30`
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
                <Box className="flex gap-2">
                  <TextField 
                    size="small" 
                    placeholder="Add new type..." 
                    value={newLeaveType}
                    onChange={(e) => setNewLeaveType(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addLeaveType()}
                    fullWidth
                    slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: 'var(--input-bg)' } } }}
                  />
                  <IconButton onClick={addLeaveType} sx={{ bgcolor: siteConfig.colors.primary, color: 'white', '&:hover': { bgcolor: siteConfig.colors.secondary } }}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.1 }} />

              {/* Categories */}
              <Box>
                <Typography variant="subtitle2" className="font-bold mb-3" sx={{ color: 'var(--text-heading)' }}>Leave Categories</Typography>
                <Box className="flex flex-wrap gap-2 mb-4">
                  <AnimatePresence>
                    {settings.leaveCategories.map((cat) => (
                      <motion.div key={cat} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Chip
                          label={cat}
                          onDelete={() => removeCategory(cat)}
                          sx={{ 
                            borderRadius: '10px', 
                            fontWeight: 700,
                            bgcolor: `${siteConfig.colors.secondary}10`,
                            color: siteConfig.colors.secondary,
                            border: `1px solid ${siteConfig.colors.secondary}30`
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
                <Box className="flex gap-2">
                  <TextField 
                    size="small" 
                    placeholder="Add new category..." 
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                    fullWidth
                    slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: 'var(--input-bg)' } } }}
                  />
                  <IconButton onClick={addCategory} sx={{ bgcolor: siteConfig.colors.secondary, color: 'white', '&:hover': { bgcolor: siteConfig.colors.primary } }}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              <Divider sx={{ opacity: 0.1 }} />

              {/* Departments */}
              <Box>
                <Typography variant="subtitle2" className="font-bold mb-3" sx={{ color: 'var(--text-heading)' }}>Organizational Departments</Typography>
                <Box className="flex flex-wrap gap-2 mb-4">
                  <AnimatePresence>
                    {(settings.departments || []).map((dept) => (
                      <motion.div key={dept} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                        <Chip
                          label={dept.replace(/_/g, ' ')}
                          onDelete={() => removeDept(dept)}
                          sx={{ 
                            borderRadius: '10px', 
                            fontWeight: 700,
                            bgcolor: `${siteConfig.colors.accent}10`,
                            color: siteConfig.colors.accent,
                            border: `1px solid ${siteConfig.colors.accent}30`
                          }}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </Box>
                <Box className="flex gap-2">
                  <TextField 
                    size="small" 
                    placeholder="Add new department..." 
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addDept()}
                    fullWidth
                    slotProps={{ input: { sx: { borderRadius: '12px', bgcolor: 'var(--input-bg)' } } }}
                  />
                  <IconButton onClick={addDept} sx={{ bgcolor: siteConfig.colors.accent, color: 'white', '&:hover': { bgcolor: siteConfig.colors.primary } }}>
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Right Column */}
        <Box className="space-y-8">
          {/* Email Matrix */}
          <Paper className="glass-card p-8 rounded-[2rem] border-none h-fit">
            <Typography variant="h6" className="font-black mb-6 flex items-center gap-3" sx={{ color: 'var(--text-heading)' }}>
              <EmailIcon sx={{ color: siteConfig.colors.accent }} />
              Leave Email Notification Matrix
            </Typography>
            <Typography variant="body2" sx={{ color: 'var(--text-muted)', mb: 4, fontWeight: 500 }}>
              Fine-tune exactly who receives email alerts at each stage of the approval workflow.
            </Typography>

            <Box className="space-y-10">
              {/* Stage 1 */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: siteConfig.colors.primary, letterSpacing: '0.05rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box className="w-1.5 h-1.5 rounded-full" sx={{ bgcolor: siteConfig.colors.primary }} />
                  STAGE 1: LEAVE APPLICATION SUBMISSION
                </Typography>
                <Box className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onApply.applicant} onChange={() => handleToggle('emailNotifications.onApply.applicant')} color="primary" />}
                    label={<Typography variant="body2" className="font-bold">Notify Applicant (Confirmation)</Typography>}
                  /> <br />
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onApply.actingOfficer} onChange={() => handleToggle('emailNotifications.onApply.actingOfficer')} color="primary" />}
                    label={<Typography variant="body2" className="font-bold">Notify Acting Officer</Typography>}
                  />
                </Box>
              </Box>

              {/* Stage 2 */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: siteConfig.colors.primary, letterSpacing: '0.05rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box className="w-1.5 h-1.5 rounded-full" sx={{ bgcolor: siteConfig.colors.primary }} />
                  STAGE 2: ACTING OFFICER DECISION
                </Typography>
                <Box className="grid grid-cols-1 gap-4 ml-6">
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onActingDecision.applicant} onChange={() => handleToggle('emailNotifications.onActingDecision.applicant')} color="primary" />}
                    label={<Typography variant="body2" className="font-bold">Notify Applicant (Decision Update)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onActingDecision.actingOfficer} onChange={() => handleToggle('emailNotifications.onActingDecision.actingOfficer')} color="primary" />}
                    label={<Typography variant="body2" className="font-bold">Notify Acting Officer (Confirmation)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onActingDecision.approver} onChange={() => handleToggle('emailNotifications.onActingDecision.approver')} color="primary" />}
                    label={<Typography variant="body2" className="font-bold">Notify Approver/Dept Head</Typography>}
                  />
                </Box>
              </Box>

              {/* Stage 3 */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 900, color: siteConfig.colors.primary, letterSpacing: '0.05rem', display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <Box className="w-1.5 h-1.5 rounded-full" sx={{ bgcolor: siteConfig.colors.primary }} />
                  STAGE 3: FINAL APPROVER DECISION
                </Typography>
                <Box className="grid grid-cols-1 gap-4 ml-6">
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onFinalDecision.applicant} onChange={() => handleToggle('emailNotifications.onFinalDecision.applicant')} color="success" />}
                    label={<Typography variant="body2" className="font-bold">Notify Applicant (Final Decision)</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onFinalDecision.actingOfficer} onChange={() => handleToggle('emailNotifications.onFinalDecision.actingOfficer')} color="success" />}
                    label={<Typography variant="body2" className="font-bold">Notify Acting Officer</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={settings.emailNotifications.onFinalDecision.approver} onChange={() => handleToggle('emailNotifications.onFinalDecision.approver')} color="success" />}
                    label={<Typography variant="body2" className="font-bold">Notify Approver (Confirmation)</Typography>}
                  />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* New: Dashboard & Automatic Reminders */}
          <Paper className="glass-card p-8 rounded-[2rem] border-none h-fit">
            <Typography variant="h6" className="font-black mb-6 flex items-center gap-3" sx={{ color: 'var(--text-heading)' }}>
              <VisibilityIcon sx={{ color: siteConfig.colors.primary }} />
              Workspace Visibility & Reminders
            </Typography>

            <Box className="space-y-8">
               {/* Visibility Setting */}
               <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', mb: 2, display: 'block' }}>
                   DASHBOARD LEAVE VISIBILITY
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={settings.dashboardLeaveVisibility || 'ALL'}
                    onChange={(e) => setSettings({ ...settings, dashboardLeaveVisibility: e.target.value })}
                    sx={{ borderRadius: '15px', bgcolor: 'var(--input-bg)', fontWeight: 800 }}
                  >
                    <MenuItem value="ALL">Visible to All Employees (Departmental)</MenuItem>
                    <MenuItem value="DEPT_HEAD_ONLY">Visible to Dept Heads & Admins Only</MenuItem>
                  </Select>
                </FormControl>
                <Typography variant="caption" className="text-slate-400 mt-2 block ml-1">
                  Controls who can see the "Upcoming Absences" lists on the main dashboard.
                </Typography>
               </Box>

               <Divider sx={{ opacity: 0.1 }} />

               {/* Automatic Reminders Manager */}
               <Box>
                <Box className="flex items-center justify-between mb-4">
                  <Typography variant="caption" sx={{ fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.1rem', display: 'block' }}>
                    AUTOMATIC EMAIL REMINDERS
                  </Typography>
                </Box>

                <List className="space-y-2 mb-4">
                  {(settings.leaveReminders || []).map((reminder, idx) => (
                    <ListItem 
                      key={idx} 
                      className="rounded-2xl border border-slate-100  p-3"
                    >
                      <ListItemText 
                        primary={
                          <Typography variant="body2" className="font-bold">
                            {reminder.dayOffset === 0 ? 'Day of Leave' : `${reminder.dayOffset} Day(s) Before`}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" className="font-medium text-slate-500">
                             Scheduled for {reminder.time} (Daily)
                          </Typography>
                        }
                      />
                      <ListItemSecondaryAction>
                        <FormControlLabel
                          control={<Switch size="small" checked={reminder.enabled} onChange={() => toggleReminder(idx)} />}
                          label=""
                        />
                        <IconButton 
                          size="small" 
                          sx={{ color: siteConfig.colors.primary, mr: 1 }} 
                          onClick={() => handleRunTestReminders(reminder.dayOffset)}
                          disabled={syncing}
                        >
                          <PlayCircleFilledIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => removeReminder(idx)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                  {(!settings.leaveReminders || settings.leaveReminders.length === 0) && (
                    <Typography variant="caption" className="text-slate-400 italic block text-center py-4">
                      No automated reminders configured.
                    </Typography>
                  )}
                </List>

                <Box className="flex gap-2 items-end">
                   <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Days Before</Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={newReminder.dayOffset}
                        onChange={(e) => setNewReminder({ ...newReminder, dayOffset: e.target.value })}
                        sx={{ borderRadius: '10px' }}
                      >
                        <MenuItem value={0}>Same Day</MenuItem>
                        <MenuItem value={1}>1 Day Before</MenuItem>
                        <MenuItem value={2}>2 Days Before</MenuItem>
                        <MenuItem value={3}>3 Days Before</MenuItem>
                        <MenuItem value={7}>1 Week Before</MenuItem>
                      </Select>
                   </Box>
                   <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, mb: 1, display: 'block' }}>Time (HH:mm)</Typography>
                      <TextField
                        size="small"
                        type="time"
                        fullWidth
                        value={newReminder.time}
                        onChange={(e) => setNewReminder({ ...newReminder, time: e.target.value })}
                        slotProps={{ input: { sx: { borderRadius: '10px' } } }}
                      />
                   </Box>
                   <Button 
                    variant="contained" 
                    onClick={addReminder}
                    sx={{ borderRadius: '10px', height: '40px', minWidth: '40px', p: 0 }}
                   >
                     <AddIcon />
                   </Button>
                </Box>
               </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar open={message.open} autoHideDuration={6000} onClose={() => setMessage({ ...message, open: false })}>
        <Alert severity={message.severity} sx={{ borderRadius: '15px', fontWeight: 700 }}>{message.text}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SystemSettingsPage;
