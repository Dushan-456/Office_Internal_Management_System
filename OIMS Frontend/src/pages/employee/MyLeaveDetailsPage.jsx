import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Backdrop, IconButton, Divider, Grid, List, ListItem, ListItemText, ListItemIcon,
  TextField, MenuItem, FormControl, InputLabel, Select, TablePagination
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { useNavigate, useParams } from 'react-router-dom';
import { leaveApi } from '../../api/leaveApi';
import { getEmployeeById } from '../../api/employeeApi';
import { siteConfig } from '../../config/siteConfig';
import { printLeaveApplication } from '../../utils/printLeaveApplication';
import useAuthStore from '../../store/useAuthStore';

const MyLeaveDetailsPage = () => {
  const { id } = useParams(); // For admin view
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState(null);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const { user, fetchCurrentUser } = useAuthStore();

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    fromDate: '',
    toDate: ''
  });
  const [summaryYear, setSummaryYear] = useState(new Date().getFullYear());

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // If id exists, fetch employee info for the title
      if (id && !employee) {
        const empRes = await getEmployeeById(id);
        if (empRes.data?.success) {
          setEmployee(empRes.data.data.employee);
        }
      }

      const res = id 
        ? await leaveApi.getEmployeeLeaves(id)
        : await leaveApi.getMyLeaves();

      if (res.data && res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch leave requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser(); // Ensure latest balance is fetched
    fetchRequests();
  }, []);

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedRequest) return;
    try {
      setSubmitting(true);
      const res = await leaveApi.deleteLeave(selectedRequest.id);
      if (res.data && res.data.success) {
        window.dispatchEvent(new CustomEvent('refreshPendingCounts'));
        setDeleteConfirmOpen(false);
        setModalOpen(false);
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (request) => {
    // Navigate to apply page with state data to enable edit mode
    navigate('/leaves/apply', { state: { requestData: request } });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Pending...';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDateTime = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page on filter change
  };

  const resetFilters = () => {
    setFilters({
      status: 'all',
      leaveType: 'all',
      fromDate: '',
      toDate: ''
    });
    setPage(0);
  };

  // Combine Filtering & Pagination Logic
  const filteredRequests = requests.filter(req => {
    const matchesStatus = filters.status === 'all' || req.status === filters.status;
    const matchesType = filters.leaveType === 'all' || req.leaveType === filters.leaveType;
    
    const reqFromDate = new Date(req.dateRange.from);
    const reqToDate = new Date(req.dateRange.to);
    
    const filterFrom = filters.fromDate ? new Date(filters.fromDate) : null;
    const filterTo = filters.toDate ? new Date(filters.toDate) : null;

    if (filterFrom) filterFrom.setHours(0,0,0,0);
    if (filterTo) filterTo.setHours(23,59,59,999);

    const matchesFrom = !filterFrom || reqFromDate >= filterFrom;
    const matchesTo = !filterTo || reqToDate <= filterTo;

    return matchesStatus && matchesType && matchesFrom && matchesTo;
  });

  const paginatedRequests = filteredRequests.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  const leaveTypes = [...new Set(requests.map(r => r.leaveType))].sort();

  if (loading) return (
    <Box className="flex justify-center items-center h-96">
      <CircularProgress sx={{ color: siteConfig.colors.primary }} />
    </Box>
  );

  return (
    <Box className="max-w-7xl mx-auto px-4 pb-12">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.2)' }}
        open={submitting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box className="flex items-center justify-between mb-8">
        <Box className="flex items-center gap-5">
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
              <>{employee?.firstName} {employee?.lastName}'s <span style={{ color: siteConfig.colors.primary }}>Leave History</span></>
            ) : (
              <>My Leave <span style={{ color: siteConfig.colors.primary }}>Details</span></>
            )}
          </Typography>
          <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
            {id 
              ? `Comprehensive leave history and usage analytics for ${employee?.firstName} ${employee?.lastName}.`
              : "Track the status of your leave applications. You can modify or delete requests that have not yet been processed."
            }
          </Typography>
        </div>
        </Box>
  
      </Box>

      {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

      {requests.length > 0 && (
        <Paper className="glass-card mb-8 p-6 rounded-[2rem] border border-slate-50 shadow-sm">
          <Box className="flex flex-col md:flex-row items-center  gap-8">
            <Box className="flex items-center gap-2 text-indigo-500 mr-2">
              <FilterAltOutlinedIcon fontSize="small" />
              <Typography variant="caption" className="font-black uppercase tracking-widest">Leave Filters</Typography>
            </Box>
            
            <Grid container spacing={6} alignItems="center" >
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="From Date"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="To Date"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending_acting">Pending Acting</MenuItem>
                    <MenuItem value="pending_approval">Pending Approval</MenuItem>
                    <MenuItem value="approved">Approved</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Leave Type</InputLabel>
                  <Select
                    value={filters.leaveType}
                    label="Leave Type"
                    onChange={(e) => handleFilterChange('leaveType', e.target.value)}
                    sx={{ borderRadius: '12px' }}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {leaveTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={resetFilters}
                  startIcon={<RestartAltIcon />}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 700, borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  Reset
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {requests.length === 0 ? (
        <Paper className="glass-card p-12 text-center rounded-[2rem]">
          <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            No leave requests found.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3, bgcolor: siteConfig.colors.primary, borderRadius: '12px', fontWeight: 700 }}
            onClick={() => navigate(id ? `/employees/${id}` : '/leaves/apply')}
          >
            {id ? 'Back to Profile' : 'Apply for Leave'}
          </Button>
        </Paper>
      ) : (
        /* Main Dual-Panel Layout matching MyProfilePage */
        <Box className="flex flex-col lg:flex-row items-start gap-10">
          
          {/* Main Content Area (Table) - Now on the left to match profile density */}
          <Box className="flex-1 w-full order-2 lg:order-1">
            <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden shadow-sm">
              <Table>
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell className="font-bold">Duration</TableCell>
                    <TableCell className="font-bold" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type & Category</TableCell>
                    <TableCell className="font-bold text-center">Acting Status</TableCell>
                    <TableCell className="font-bold text-center">Approve Status</TableCell>
                    <TableCell className="font-bold" align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <Typography variant="body2" className="text-slate-400 font-bold italic">No records match your active filters.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedRequests.map((req) => {
                    const isPending = req.actingOfficerStatus === 'pending' && req.deptHeadStatus === 'pending';

                    return (
                      <TableRow 
                        key={req.id} 
                        hover 
                        onClick={() => handleOpenModal(req)}
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'rgba(99, 102, 241, 0.04) !important'
                          }
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" className="font-bold" sx={{ color: 'var(--text-heading)' }}>
                            {formatDate(req.dateRange.from)} - {formatDate(req.dateRange.to)}
                          </Typography>
                          <Typography variant="caption" className="text-indigo-500 block font-black" >
                            {req.totalDays} Work Days
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="body2" className="font-bold">
                            {req.leaveType}
                          </Typography>
                          <Typography variant="caption" className="text-slate-500 font-medium">
                            {req.category}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Chip 
                              label={req.actingOfficerStatus?.toUpperCase()} 
                              size="small" 
                              color={req.actingOfficerStatus === 'approved' ? 'success' : req.actingOfficerStatus === 'rejected' ? 'error' : 'warning'}
                              sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                            />
                            {req.actingOfficerDecisionDate && (
                              <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                                {formatShortDateTime(req.actingOfficerDecisionDate)}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                           {req.actingOfficerStatus === 'rejected' ? (
                               <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>----</Typography>
                            ) : (
                               <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                                 <Chip 
                                   label={req.deptHeadStatus?.toUpperCase() || 'PENDING'} 
                                   size="small" 
                                   color={req.deptHeadStatus === 'approved' ? 'success' : req.deptHeadStatus === 'rejected' ? 'error' : 'warning'}
                                   sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                                 />
                                 {req.deptHeadDecisionDate && (
                                   <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                                     {formatShortDateTime(req.deptHeadDecisionDate)}
                                   </Typography>
                                 )}
                               </Box>
                            )}
                        </TableCell>
                        <TableCell align="right">
                          <Box className="flex justify-end gap-1">
                            <IconButton size="small" sx={{ color: siteConfig.colors.primary }}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {isPending && (
                              <>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => { e.stopPropagation(); handleEdit(req); }}
                                  sx={{ color: siteConfig.colors.secondary }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton 
                                  size="small" 
                                  onClick={(e) => { e.stopPropagation(); setSelectedRequest(req); handleDelete(req.id); }}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredRequests.length}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[20]}
                sx={{
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                  '.MuiTablePagination-selectLabel, .MuiTablePagination-input': { display: 'none !important' }
                }}
              />
            </TableContainer>
          </Box>

          {/* Sticky Summary Card Sidebar - Configured like Profile Sidebar but narrower */}
          <Box className="w-full lg:w-[300px] xl:w-[340px] lg:sticky top-24 z-10 shrink-0 order-1 lg:order-2">
            <Paper className="glass-card p-6 rounded-[2.5rem] border border-slate-50 shadow-xl overflow-hidden">
              <Box className="flex justify-between items-start mb-6">
                <Box className="flex items-center gap-3">
                  <Box className="w-1.5 h-8 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
                  <Box>
                    <Typography variant="h6" className="font-black" sx={{ color: 'var(--text-heading)' }}>Usage Summary</Typography>
                    <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest">{summaryYear} Record</Typography>
                  </Box>
                </Box>
                <FormControl size="small" sx={{ minWidth: 80 }}>
                  <Select
                    value={summaryYear}
                    onChange={(e) => setSummaryYear(e.target.value)}
                    sx={{ borderRadius: '12px', height: '32px', fontSize: '0.8rem', fontWeight: 'bold' }}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - i;
                      return <MenuItem key={year} value={year}>{year}</MenuItem>;
                    })}
                  </Select>
                </FormControl>
              </Box>

              <Box className="mb-8 p-2 rounded-[2.5rem]  border border-indigo-100 text-center relative overflow-hidden group">
                <Box className="absolute top-0 right-0 w-24 h-24  rounded-full -mr-10 -mt-10 blur-2xl" />
                <Typography variant="h2" className="font-black uppercase text-indigo-400 tracking-tighter relative z-10">                 
                   {requests
                     .filter(l => l.status === 'approved' && new Date(l.dateRange.from).getFullYear() === summaryYear)
                     .reduce((sum, l) => sum + (l.totalDays || 0), 0)}</Typography>
                <Typography variant="caption" className="font-black uppercase text-indigo-400 tracking-tighter relative z-10">Approved Leaves Total</Typography>
                <Typography variant="h5" className="font-black  relative z-10">
                  {(id ? employee : user)?.leaveBalances?.find(b => b.year === summaryYear)?.annualBalance ?? 0} Remaining
                </Typography>
              </Box>

              <Box className="space-y-6">
                {(() => {
                  const approvedRequests = requests.filter(l => 
                    l.status === 'approved' && 
                    new Date(l.dateRange.from).getFullYear() === summaryYear
                  );
                  const uniqueTypes = [...new Set(approvedRequests.map(l => l.leaveType))].sort();
                  const grandTotal = approvedRequests.reduce((sum, l) => sum + (l.totalDays || 0), 0) || 1;

                  if (uniqueTypes.length === 0) {
                    return <Typography variant="caption" className="text-slate-400 italic px-2">No approved records yet.</Typography>;
                  }

                  return uniqueTypes.map(type => {
                    const days = approvedRequests.filter(l => l.leaveType === type).reduce((sum, l) => sum + (l.totalDays || 0), 0);
                    const percentage = Math.round((days / grandTotal) * 100);
                    const typeColors = { Annual: '#6366f1', Medical: '#10b981', Casual: '#f59e0b', Short: '#ec4899' };
                    const color = typeColors[type] || siteConfig.colors.primary;

                    return (
                      <Box key={type} className="p-2">
                        <Box className="flex justify-between items-center mb-1.5">
                          <Box className="flex items-center gap-2">
                            <Box className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                            <Typography variant="caption" className="font-bold ">{type} Leave</Typography>
                          </Box>
                          <Typography variant="caption" className="font-black" sx={{ color: 'var(--text-heading)' }}>{days} Days</Typography>
                        </Box>
                        <Box className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="h-full rounded-full"
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{ backgroundColor: color }}
                          />
                        </Box>
                      </Box>
                    );
                  });
                })()}
              </Box>
              
              <Divider className="my-6" sx={{ borderStyle: 'dashed', opacity: 0.5 }} />
              
              {!id && (
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => navigate('/leaves/apply')}
                  sx={{ 
                    py: 1.8,
                    borderRadius: '15px', 
                    bgcolor: siteConfig.colors.primary, 
                    fontWeight: 800, 
                    textTransform: 'none',
                    boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  Apply for New Leave
                </Button>
              )}
            </Paper>
          </Box>
        </Box>
      )}

      {/* Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        slotProps={{
          backdrop: {
            sx: {
              backdropFilter: 'blur(8px)',
              backgroundColor: 'rgba(15, 23, 42, 0.4)'
            }
          }
        }}
        PaperProps={{
          className: "glass-card rounded-[2rem]",
          sx: { p: 1 }
        }}
      >
        <DialogTitle className="font-black text-2xl flex justify-between items-center">
          Overview
          <Box className="flex items-center gap-1">
            <IconButton 
              onClick={() => printLeaveApplication(selectedRequest, id ? employee : user, siteConfig)} 
              sx={{ color: siteConfig.colors.primary }}
              title="Print Leave Application"
            >
              <PrintIcon />
            </IconButton>
            <IconButton onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box className="space-y-4 py-2">
              <Box className="grid grid-cols-2 gap-4 mt-2">
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Leave Type</Typography>
                  <Typography variant="body1" className="font-semibold">{selectedRequest.leaveType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Category</Typography>
                  <Typography variant="body1" className="font-semibold">{selectedRequest.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">From Date</Typography>
                  <Typography variant="body1" className="font-semibold">{formatDate(selectedRequest.dateRange.from)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">To Date</Typography>
                  <Typography variant="body1" className="font-semibold">{formatDate(selectedRequest.dateRange.to)}</Typography>
                </Box>
              </Box>

              <Divider className="my-4" />

              <Box className="mt-4">
                <Typography variant="caption" className="font-bold text-slate-400 uppercase">Reason for Leave</Typography>
                <Paper sx={{ p: 2, mt: 1, borderRadius: '12px', border: '1px solid #e2e8f0', bgcolor: 'rgba(0,0,0,0.01)' }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedRequest.reason}</Typography>
                </Paper>
              </Box>

              <Box className="mt-4">
                <Typography variant="caption" className="font-bold text-slate-400 uppercase">Contact Address</Typography>
                <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2" sx={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{selectedRequest.addressWhileOnLeave}</Typography>
                </Paper>
              </Box>

              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <Box className="mt-4">
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Supporting Documents ({selectedRequest.attachments.length})</Typography>
                  <Box className="mt-2 flex flex-col gap-2">
                    {selectedRequest.attachments.map((attachment, idx) => (
                    <Paper 
                      key={idx}
                      elevation={0}
                      sx={{ 
                        p: 1.5, 
                        bgcolor: 'rgba(99, 102, 241, 0.05)', 
                        borderRadius: '12px', 
                        border: '1px solid rgba(99, 102, 241, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.1)' }
                      }}
                      onClick={() => window.open(`${import.meta.env.VITE_ASSET_URL}${attachment}`, '_blank')}
                    >
                      <Box className="flex items-center gap-2 overflow-hidden">
                        <Box sx={{ color: siteConfig.colors.primary }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {attachment.split('/').pop()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: siteConfig.colors.primary, fontWeight: 700, whiteSpace: 'nowrap', ml: 2 }}>
                        OPEN
                      </Typography>
                    </Paper>
                    ))}
                  </Box>
                </Box>
              )}

              <Divider className="my-4" />

              <Box className="grid grid-cols-2 gap-4 mt-2  p-4 rounded-xl border border-slate-200">
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Acting Officer</Typography>
                  <Typography variant="body2" className="font-semibold">
                    {selectedRequest.actingOfficerId?.firstName} {selectedRequest.actingOfficerId?.lastName}
                  </Typography>
                  <Chip 
                    label={selectedRequest.actingOfficerStatus?.toUpperCase() || 'PENDING'} 
                    size="small" 
                    color={selectedRequest.actingOfficerStatus === 'approved' ? 'success' : selectedRequest.actingOfficerStatus === 'rejected' ? 'error' : 'warning'}
                    sx={{ fontWeight: 800, fontSize: '0.65rem', mt: 1 }} 
                  />
                  {selectedRequest.actingOfficerDecisionDate && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                      {formatDateTime(selectedRequest.actingOfficerDecisionDate)}
                    </Typography>
                  )}
                </Box>
                
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Department Head</Typography>
                  <Typography variant="body2" className="font-semibold">
                    {selectedRequest.approveOfficerId?.firstName} {selectedRequest.approveOfficerId?.lastName}
                  </Typography>
                  {selectedRequest.actingOfficerStatus === 'rejected' ? (
                       <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', mt: 1, display: 'block' }}>N/A</Typography>
                  ) : (
                    <>
                      <Chip 
                        label={selectedRequest.deptHeadStatus?.toUpperCase() || 'PENDING'} 
                        size="small" 
                        color={selectedRequest.deptHeadStatus === 'approved' ? 'success' : selectedRequest.deptHeadStatus === 'rejected' ? 'error' : 'warning'}
                        sx={{ fontWeight: 800, fontSize: '0.65rem', mt: 1 }} 
                      />
                      {selectedRequest.deptHeadDecisionDate && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                          {formatDateTime(selectedRequest.deptHeadDecisionDate)}
                        </Typography>
                      )}
                    </>
                  )}
                </Box>
              </Box>
              
              {/* Workflow Timeline Section */}
              <Box className="mt-8 pt-6 border-t border-slate-100">
                <Typography variant="caption" className="font-black text-slate-400 uppercase tracking-widest block mb-6">
                  Workflow Timeline
                </Typography>
                
                <Box className="space-y-6 relative before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-500">
                  {/* Step 1: applied */}
                  <Box className="flex gap-4 relative z-10">
                    <Box className="w-6 h-6 rounded-full bg-indigo-500 border-4 border-white shadow-sm flex items-center justify-center shrink-0">
                      <Box className="w-1.5 h-1.5 rounded-full bg-white" />
                    </Box>
                    <Box>
                      <Typography variant="body2" className="font-bold ">Request Submitted</Typography>
                      <Typography variant="caption" className=" flex items-center gap-1.5">
                        {formatDateTime(selectedRequest.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 2: acting */}
                  <Box className="flex gap-4 relative z-10">
                    <Box className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${
                      selectedRequest.actingOfficerStatus === 'approved' ? 'bg-emerald-500' : 
                      selectedRequest.actingOfficerStatus === 'rejected' ? 'bg-red-500' : 'bg-amber-400'
                    }`}>
                      <Box className="w-1.5 h-1.5 rounded-full bg-white" />
                    </Box>
                    <Box>
                      <Typography variant="body2" className="font-bold ">
                        Acting Approval {selectedRequest.actingOfficerStatus !== 'pending' && `(${selectedRequest.actingOfficerStatus})`}
                      </Typography>
                      <Typography variant="caption" >
                        {selectedRequest.actingOfficerDecisionDate ? formatDateTime(selectedRequest.actingOfficerDecisionDate) : 'Awaiting response from acting officer'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 3: final */}
                  <Box className="flex gap-4 relative z-10">
                    <Box className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${
                      selectedRequest.deptHeadStatus === 'approved' ? 'bg-emerald-500' : 
                      selectedRequest.deptHeadStatus === 'rejected' ? 'bg-red-500' : 'bg-slate-200'
                    }`}>
                      <Box className="w-1.5 h-1.5 rounded-full bg-white" />
                    </Box>
                    <Box>
                      <Typography variant="body2" className="font-bold ">
                        Final Approval {selectedRequest.deptHeadStatus !== 'pending' && `(${selectedRequest.deptHeadStatus})`}
                      </Typography>
                      <Typography variant="caption" >
                        {selectedRequest.deptHeadDecisionDate ? formatDateTime(selectedRequest.deptHeadDecisionDate) : 
                         selectedRequest.actingOfficerStatus === 'rejected' ? 'Process terminated' : 'Pending final administrative review'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {selectedRequest.rejectionReason && (
                <Box className="mt-4">
                  <Typography variant="caption" className="font-bold text-red-500 uppercase">Reason for Rejection</Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Typography variant="body2" sx={{ color: '#b91c1c', fontWeight: 600 }}>
                      {selectedRequest.rejectionReason}
                    </Typography>
                  </Paper>
                </Box>
              )}

            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Box className="flex gap-2 w-full justify-between">
            <Box className="flex gap-2">
              {selectedRequest && selectedRequest.actingOfficerStatus === 'pending' && selectedRequest.deptHeadStatus === 'pending' && (
                <>
                  <Button 
                    variant="outlined" 
                    color="error"
                    disabled={submitting}
                    onClick={() => handleDelete(selectedRequest.id)}
                    startIcon={<DeleteIcon />}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
                  >
                    Delete
                  </Button>
                  <Button 
                    variant="contained" 
                    disabled={submitting}
                    onClick={() => { handleCloseModal(); handleEdit(selectedRequest); }}
                    startIcon={<EditIcon />}
                    sx={{ 
                      bgcolor: siteConfig.colors.secondary,
                      borderRadius: '12px', 
                      textTransform: 'none', 
                      fontWeight: 800,
                      px: 4
                    }}
                  >
                    Edit Request
                  </Button>
                </>
              )}
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => printLeaveApplication(selectedRequest, id ? employee : user, siteConfig)}
              startIcon={<PrintIcon />}
              sx={{ 
                borderRadius: '12px', 
                textTransform: 'none', 
                fontWeight: 800,
                borderColor: siteConfig.colors.primary,
                color: siteConfig.colors.primary,
              }}
            >
              Print
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Deletion Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmOpen} 
        onClose={() => setDeleteConfirmOpen(false)}
        slotProps={{
          backdrop: {
            sx: { backdropFilter: 'blur(12px)', backgroundColor: 'rgba(255, 255, 255, 0.2)' }
          }
        }}
        PaperProps={{
          className: "glass-card rounded-[2rem]",
          sx: { p: 1 }
        }}
      >
        <DialogTitle className="font-black text-xl text-red-600">
          Delete Leave Request?
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to delete your leave request from <strong>{selectedRequest && formatDate(selectedRequest.dateRange?.from)}</strong> to <strong>{selectedRequest && formatDate(selectedRequest.dateRange?.to)}</strong>?
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'error.main', fontWeight: 600 }}>
            This action cannot be undone and your nominated Acting Officer will be notified.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)} 
            sx={{ fontWeight: 700, borderRadius: '12px', textTransform: 'none' }}
          >
            Keep Request
          </Button>
          <Button 
            variant="contained" 
            color="error"
            disabled={submitting}
            onClick={confirmDelete}
            startIcon={<DeleteIcon />}
            sx={{ fontWeight: 800, borderRadius: '12px', px: 3, textTransform: 'none' }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MyLeaveDetailsPage;
