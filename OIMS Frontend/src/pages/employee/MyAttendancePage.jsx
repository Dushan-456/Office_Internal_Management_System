import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  FormControl, Select, MenuItem, CircularProgress, Chip, Divider, Button
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { attendanceApi } from '../../api/attendanceApi';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import { getEmployeeById } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';

const currentYear = new Date().getFullYear();

const MyAttendancePage = () => {
  const { id } = useParams(); // For admin view
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [employeeName, setEmployeeName] = useState('');
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1); // 1-12
  const [selectedDay, setSelectedDay] = useState('all');

  useEffect(() => {
    fetchAttendance();
  }, [selectedYear, selectedMonth, id]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      
      // If id exists, fetch employee info for the title
      if (id && !employeeName) {
        const empRes = await getEmployeeById(id);
        if (empRes.data?.success) {
          const emp = empRes.data.data.employee;
          setEmployeeName(`${emp.firstName} ${emp.lastName}`);
        }
      }

      const res = id 
        ? await attendanceApi.getEmployeeAttendance(id, selectedYear, selectedMonth)
        : await attendanceApi.getMyAttendance(selectedYear, selectedMonth);

      if (res.data && res.data.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch attendance:", err);
    } finally {
      setLoading(false);
    }
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
    setSelectedDay('all');
  };

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  const displayedRecords = selectedDay === 'all' 
    ? records 
    : records.filter(r => new Date(r.date).getDate() === parseInt(selectedDay));

 
  


  const totalWorkHours = records.reduce((sum, r) => sum + (r.workHours || 0), 0);
  
  const getAvgTime = (dateArray, key) => {
    const validDates = dateArray.filter(r => r[key]).map(r => new Date(r[key]));
    if (validDates.length === 0) return '--:--';
    
    const totalMinutes = validDates.reduce((sum, d) => {
      return sum + d.getHours() * 60 + d.getMinutes();
    }, 0);
    
    const avgMinutes = Math.floor(totalMinutes / validDates.length);
    const hours = Math.floor(avgMinutes / 60);
    const mins = avgMinutes % 60;
    
    return new Date(0, 0, 0, hours, mins).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const avgCheckIn = getAvgTime(records, 'checkIn');
  const avgCheckOut = getAvgTime(records, 'checkOut');

  const StatusChip = ({ status }) => {
    let color = 'default';
    if (status === 'Present') color = 'success';
    if (status === 'Absent') color = 'error';
    if (status === 'Late') color = 'warning';
    if (status === 'Half Day') color = 'info';

    return <Chip label={status} color={color} size="small" sx={{ fontWeight: 'bold' }} />;
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className='flex items-center gap-5'>
         {id && (
          <Button 
            variant="contained" 
            onClick={() => navigate(`/employees/${id}`)}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, borderColor: 'var(--glass-border)', color: 'var(--text-heading)' }}
          >
            Back to Profile
          </Button>
        )}
        <div>

          <Typography variant="h4" className="font-black tracking-tight mb-2" sx={{ color: 'var(--text-heading)' }}>
            {id ? (
              <>{employeeName || 'Employee'}'s <span style={{ color: siteConfig.colors.primary }}>Attendance</span></>
            ) : (
              <>My <span style={{ color: siteConfig.colors.primary }}>Attendance</span></>
            )}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
            {id ? `Reviewing attendance records for ${employeeName}.` : "View your daily logs, total hours, and overtime statistics."}
          </Typography>
        </div>
        </div>
    
      </div>

      {/* Filter Bar */}
      <div className="glass-card mb-8 p-6 rounded-[2rem] border border-white/10 shadow-sm flex flex-wrap lg:flex-nowrap gap-6 items-end">
        <div className="flex-1 min-w-[120px]">
          <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Select Year</Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              sx={{ borderRadius: '12px' }}
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="flex-1 min-w-[150px]">
          <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Select Month</Typography>
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
        <div className="flex-1 min-w-[120px]">
          <Typography variant="caption" className="font-bold text-slate-400 uppercase block mb-1">Select Date</Typography>
          <FormControl size="small" fullWidth>
            <Select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              sx={{ borderRadius: '12px' }}
            >
              <MenuItem value="all">All Days</MenuItem>
              {[...Array(daysInMonth)].map((_, i) => (
                <MenuItem key={i + 1} value={i + 1}>{i + 1}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
        <div className="flex-none pb-[2px]">
          <Button 
            variant="outlined" 
            color="inherit" 
            startIcon={<RestartAltIcon />}
            onClick={handleResetFilters}
            sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 'bold', height: '40px' }}
          >
            Reset
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start w-full">
        {/* Left Column: Table (70% on desktop, 100% on mobile) */}
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
                    <TableCell className="font-bold">Check Out</TableCell>
                    <TableCell className="font-bold" sx={{ display: { xs: 'none', md: 'table-cell' }, textAlign: 'center' }}>Work Hrs</TableCell>
                    <TableCell className="font-bold" sx={{ display: { xs: 'none', md: 'table-cell' }, textAlign: 'center' }}>Status</TableCell>
                    <TableCell className="font-bold" sx={{ textAlign: 'center' }}>Leave</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" className="text-slate-400 font-bold italic">
                          No attendance records found for this criteria.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : displayedRecords.map((row) => (
                    <TableRow key={row._id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" className="font-bold">
                          {formatDate(row.date)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium ">
                          {formatTime(row.checkIn)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" className="font-medium ">
                          {formatTime(row.checkOut)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textAlign: 'center' }}>
                        <Typography variant="body2" className={`font-black ${row.workHours >= 8 ? 'text-green-500' : 'text-red-500'}`}>
                          {row.workHours ? `${row.workHours.toFixed(1)}h` : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, textAlign: 'center' }}>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {row.isOnLeave ? (
                          <Chip 
                            label={`On approved leave (${row.leaveType || 'Approved'})`} 
                            color="info" 
                            variant="outlined" 
                            size="small" 
                            sx={{ fontWeight: 'bold', borderRadius: '12px' }} 
                          />
                        ) : (
                          <Typography variant="body2" className="text-slate-300">--</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </div>

        {/* Right Column: Analytics (30%) - Hidden on mobile, sticky on desktop */}
        <Box sx={{ display: { xs: 'none', lg: 'block' }, width: '30%', flexShrink: 0, position: 'sticky', top: '6rem', alignSelf: 'flex-start' }}>
          <div className="glass-card p-6 rounded-[2.5rem] border border-white/10 shadow-xl relative overflow-hidden">
            <div className="space-y-4">
              <div className="mb-6 p-8 rounded-[2rem] border border-indigo-500/20 bg-indigo-500/5 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full -mr-12 -mt-12 blur-2xl" />
                <FingerprintIcon sx={{ color: siteConfig.colors.primary, fontSize: 60 }} />

                <Typography variant="caption" className="font-black uppercase tracking-[0.2em] text-indigo-400 block mb-2">Total Work Hours</Typography>
                <Typography variant="h2" className="font-black text-indigo-500 relative z-10 tracking-tighter leading-none">
                  {totalWorkHours.toFixed(1)}<span className="text-2xl ml-1 font-medium opacity-60">h</span>
                </Typography>
                <Typography variant="caption" className="block mt-4 text-slate-400 font-bold opacity-60">Calculated for this month</Typography>
              </div>

              <div className="p-6 rounded-[2rem] border border-slate-100  shadow-sm hover:shadow-md transition-shadow duration-300">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-left">
                    <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest block mb-1">Avg Check In</Typography>
                    <Typography variant="h5" className="font-black ">{avgCheckIn}</Typography>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                
                <Divider className="mb-6 opacity-30" />
                
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest block mb-1">Avg Check Out</Typography>
                    <Typography variant="h5" className="font-black ">{avgCheckOut}</Typography>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Box>
      </div>
    </div>
  );
};

export default MyAttendancePage;
