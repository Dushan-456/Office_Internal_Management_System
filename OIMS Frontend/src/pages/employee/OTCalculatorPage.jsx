import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  FormControl, Select, MenuItem, CircularProgress, Chip, Divider, Button, TextField, Checkbox, FormControlLabel,
  Stack, Tooltip
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CalculateIcon from '@mui/icons-material/Calculate';
import SettingsIcon from '@mui/icons-material/Settings';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { motion } from 'framer-motion';
import { attendanceApi } from '../../api/attendanceApi';
import { siteConfig } from '../../config/siteConfig';
import useAuthStore from '../../store/useAuthStore';
import { printOTDetails } from '../../utils/printOTDetails';
import PrintIcon from '@mui/icons-material/Print';

const currentYear = new Date().getFullYear();

// Minimum OT Thresholds (in hours)
const MORNING_MIN_OT = 0.75; // 45 Minutes
const EVENING_MIN_OT = 0.75; // 45 Minutes

const OTCalculatorPage = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  
  // Settings States
  const [dutyOnTime, setDutyOnTime] = useState('08:30');
  const [dutyOffTime, setDutyOffTime] = useState('16:30');
  const [includeMorningOT, setIncludeMorningOT] = useState(false);

  // Filter States
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  useEffect(() => {
    fetchAttendance();
  }, [selectedYear, selectedMonth]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getMyAttendance(selectedYear, selectedMonth);
      if (res.data && res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const parseTime = (dateStr, timeStr) => {
    const d = new Date(dateStr);
    const [h, m] = timeStr.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d;
  };

  const calculateDailyOT = (checkIn, checkOut, date) => {
    if (!checkIn || !checkOut) return 0;
    
    const cin = new Date(checkIn);
    const cout = new Date(checkOut);
    const dutyStart = parseTime(date, dutyOnTime);
    const dutyEnd = parseTime(date, dutyOffTime);
    
    let totalOT = 0;
    
    // Morning OT
    if (includeMorningOT && cin < dutyStart) {
      const diffHrs = (dutyStart - cin) / (1000 * 60 * 60);
      if (diffHrs >= MORNING_MIN_OT) {
        totalOT += diffHrs;
      }
    }
    
    // Evening OT
    if (cout > dutyEnd) {
      const diffHrs = (cout - dutyEnd) / (1000 * 60 * 60);
      if (diffHrs >= EVENING_MIN_OT) {
        totalOT += diffHrs;
      }
    }
    
    return Math.max(0, totalOT);
  };

  const formatOTDisplay = (decimalHours) => {
    if (!decimalHours || decimalHours <= 0) return '---';
    const totalMinutes = Math.round(decimalHours * 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    if (hrs > 0) {
      return `${hrs} Hrs ${mins > 0 ? `${mins} Min` : ''}`;
    }
    return `${mins} Min`;
  };

  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    const year = d.getFullYear();
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate().toString().padStart(2, '0');
    const weekday = d.toLocaleString('en-US', { weekday: 'short' });
    return `${year} - ${month} - ${day} : ${weekday}`;
  };

  const handleResetFilters = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
    setDutyOnTime('08:30');
    setDutyOffTime('16:30');
    setIncludeMorningOT(false);
  };

  const totalOTHours = records.reduce((sum, r) => {
    return sum + calculateDailyOT(r.checkIn, r.checkOut, r.date);
  }, 0);

  const handlePrint = () => {
    // Inject dailyOT into records for the printer
    const recordsWithOT = records.map(r => ({
      ...r,
      dailyOT: calculateDailyOT(r.checkIn, r.checkOut, r.date)
    }));

    const settings = {
      dutyOnTime,
      dutyOffTime,
      includeMorningOT,
      year: selectedYear,
      month: selectedMonth
    };

    printOTDetails(recordsWithOT, user, settings, siteConfig);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Typography variant="h4" className="font-black tracking-tight mb-2" sx={{ color: 'var(--text-heading)' }}>
            OT <span style={{ color: siteConfig.colors.primary }}>Calculator</span>
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
            Simulate and calculate your overtime hours based on interactive duty time settings.
          </Typography>
        </div>
      </div>

      {/* Control Bar */}
      <div className="glass-card mb-8 p-6 rounded-[2rem] border border-white/10 shadow-sm flex flex-wrap lg:flex-nowrap gap-6 items-center">
        <div className="flex-none min-w-[120px]">
          <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Year</Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ borderRadius: '12px' }}
            >
              {[currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="flex-none min-w-[150px]">
          <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Month</Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ borderRadius: '12px' }}
            >
              {[...Array(12)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>
                  {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, mx: 1 }} />

        <div className="flex-1 flex flex-wrap items-center gap-6">
          <div className="min-w-[120px]">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Duty On Time</Typography>
            <TextField 
              type="time" 
              size="small" 
              value={dutyOnTime}
              onChange={(e) => setDutyOnTime(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </div>
          <div className="min-w-[120px]">
            <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Duty Off Time</Typography>
            <TextField 
              type="time" 
              size="small" 
              value={dutyOffTime}
              onChange={(e) => setDutyOffTime(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
            />
          </div>
          <FormControlLabel
            control={
              <Checkbox 
                checked={includeMorningOT} 
                onChange={(e) => setIncludeMorningOT(e.target.checked)}
                sx={{ color: siteConfig.colors.primary, '&.Mui-checked': { color: siteConfig.colors.primary } }}
              />
            }
            label={
              <Typography variant="body2" className="font-bold ">
                Include Morning OT
              </Typography>
            }
          />
        </div>

        <div className="flex-none">
          <Button 
            variant="outlined" 
            color="inherit" 
            startIcon={<RestartAltIcon />}
            onClick={handleResetFilters}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold' }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* Left Column: Table */}
        <div className="w-full lg:w-[70%] flex-shrink-0 min-w-0">
          <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden shadow-sm border border-white/10">
            {loading ? (
              <Box className="flex justify-center items-center py-20">
                <CircularProgress sx={{ color: siteConfig.colors.primary }} />
              </Box>
            ) : (
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell className="font-bold">Date</TableCell>
                    <TableCell className="font-bold">Check In</TableCell>
                    <TableCell className="font-bold ">Check Out</TableCell>
                    <TableCell className="font-bold" sx={{ textAlign: 'center' }}> OT Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {records.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" className="text-slate-400 font-bold italic">
                          No logs found for this period.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : records.map((row) => {
                    const dailyOT = calculateDailyOT(row.checkIn, row.checkOut, row.date);
                    return (
                      <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        <TableCell>
                          <Typography variant="body2" className="font-bold">{formatDate(row.date)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-medium">{formatTime(row.checkIn)}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" className="font-medium">{formatTime(row.checkOut)}</Typography>
                        </TableCell>
                        <TableCell sx={{ textAlign: 'center'  }}>
                          <Typography variant="body2" className={`font-black !font-bold ${dailyOT > 0 ? 'text-indigo-500' : 'text-slate-300'}`}>
                            {formatOTDisplay(dailyOT)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </div>

        {/* Right Column: Calculation Summary */}
        <Box sx={{ width: '100%', lg: { width: '30%' }, position: 'sticky', top: '6rem' }}>
          <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden">
            <div className="space-y-6">
              {/* Main Total Display */}
              <div className="p-8 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <CalculateIcon sx={{ fontSize: 40, color: 'indigo.400', mb: 2, opacity: 0.5 }} />
                <Typography variant="caption" className="font-black uppercase tracking-[0.2em] text-indigo-400 block mb-2">Total OT Hours</Typography>
                <Typography variant="h2" className={` font-bold relative z-10 tracking-tighter leading-none flex items-baseline justify-center gap-2`}>
                  {Math.floor(Math.round(totalOTHours * 60) / 60)} 
                  <span className="text-2xl font-medium opacity-60">H r s</span>
                  {Math.round(totalOTHours * 60) % 60 > 0 && (
                    <>
                      <span className="mx-1"></span>
                      {Math.round(totalOTHours * 60) % 60}
                      <span className="text-2xl font-medium opacity-60">M i n</span>
                    </>
                  )}
                </Typography>
                <Typography variant="caption" className="block mt-4 text-slate-300 font-bold opacity-60 italic">Estimated for {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' })}</Typography>
              </div>

              {/* Active Settings Summary */}
              <div className="p-6 rounded-[2rem] border border-slate-100  space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <SettingsIcon sx={{ fontSize: 18, color: 'slate.400' }} />
                  <Typography variant="subtitle2" className="font-black  uppercase tracking-widest">Active Settings</Typography>
                </div>
                
                <Stack spacing={2.5}>
                  <Box className="flex justify-between items-center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'emerald.500' }} />
                      <Typography variant="caption" className="font-bold text-slate-500">Duty Start</Typography>
                    </Stack>
                    <Typography variant="body2" className="font-black text-indigo-500">{dutyOnTime}</Typography>
                  </Box>

                  <Box className="flex justify-between items-center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <AccessTimeIcon sx={{ fontSize: 16, color: 'rose.500' }} />
                      <Typography variant="caption" className="font-bold text-slate-500">Duty End</Typography>
                    </Stack>
                    <Typography variant="body2" className="font-black text-indigo-500">{dutyOffTime}</Typography>
                  </Box>

                  <Box className="flex justify-between items-center">
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <div className={`w-2 h-2 rounded-full ${includeMorningOT ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                      <Typography variant="caption" className="font-bold text-slate-500">Morning OT</Typography>
                    </Stack>
                    <Chip 
                      label={includeMorningOT ? 'ENABLED' : 'DISABLED'} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.6rem', 
                        fontWeight: 900,
                        bgcolor: includeMorningOT ? 'green' : 'red',
                        color: includeMorningOT ? 'white' : 'white'
                      }} 
                    />
                  </Box>
                </Stack>
              </div>

              {/* Print Button */}
              <Button
                variant="contained"
                fullWidth
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                disabled={loading || records.length === 0}
                sx={{
                  borderRadius: '1.5rem',
                  py: 2,
                  textTransform: 'none',
                  fontWeight: 900,
                  fontSize: '1rem',
                  background: 'linear-gradient(45deg, #6366f1, #818cf8)',
                  boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #4f46e5, #6366f1)',
                  }
                }}
              >
                Print OT Statement
              </Button>

             
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default OTCalculatorPage;
