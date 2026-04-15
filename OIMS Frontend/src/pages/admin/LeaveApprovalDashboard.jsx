import React, { useState, useEffect } from 'react';
import {  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Avatar, IconButton, Divider, Backdrop, TextField, Grid, MenuItem, FormControl, InputLabel, Select, TablePagination
} from '@mui/material';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import PrintIcon from '@mui/icons-material/Print';
import { leaveApi } from '../../api/leaveApi';
import { siteConfig } from '../../config/siteConfig';
import { printLeaveApplication } from '../../utils/printLeaveApplication';

const LeaveApprovalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const [page, setPage] = useState(0);
  const rowsPerPage = 20;
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    leaveType: 'all',
    fromDate: '',
    toDate: ''
  });
  
  const ASSET_BASE = import.meta.env.VITE_ASSET_URL || 'http://localhost:5000';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getAllLeaves();
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

  const handleDecision = async (id, status, reason = null) => {
    try {
      setSubmitting(true);
      const res = await leaveApi.finalDecision(id, status, reason);
      if (res.data && res.data.success) {
        window.dispatchEvent(new CustomEvent('refreshPendingCounts'));
        setModalOpen(false);
        setRejectionDialogOpen(false);
        setRejectionReason('');
        setSelectedRequest(null);
        fetchRequests();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const getActingStatusChip = (status) => {
    switch (status) {
      case 'approved': return <Chip label="APPROVED" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      case 'rejected': return <Chip label="REJECTED" size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      default: return <Chip label="PENDING" size="small" color="warning" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
    }
  };

  const getFinalStatusChip = (status) => {
    switch (status) {
      case 'approved': return <Chip label="APPROVED" size="small" color="success" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      case 'rejected': return <Chip label="REJECTED" size="small" color="error" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
      default: return <Chip label="PENDING" size="small" color="warning" sx={{ fontWeight: 800, fontSize: '0.65rem' }} />;
    }
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
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      leaveType: 'all',
      fromDate: '',
      toDate: ''
    });
    setPage(0);
  };

  // Combine Filtering & Pagination Logic
  const filteredRequests = requests.filter(req => {
    const applicantName = `${req.applicantId?.firstName} ${req.applicantId?.lastName}`.toLowerCase();
    const employeeNo = req.applicantId?.employeeNo?.toLowerCase() || '';
    const matchesSearch = !filters.search || 
      applicantName.includes(filters.search.toLowerCase()) || 
      employeeNo.includes(filters.search.toLowerCase());
    
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

    return matchesSearch && matchesStatus && matchesType && matchesFrom && matchesTo;
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

      <Box className="mb-8">
        <Typography variant="h4" className="font-black tracking-tight mb-2" sx={{ color: 'var(--text-heading)' }}>
          Leave <span style={{ color: siteConfig.colors.primary }}>Requests</span>
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
          Review and manage all leave requests assigned to your department.
        </Typography>
      </Box>

      {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

      {requests.length > 0 && (
        <Paper className="glass-card mb-8 p-6 rounded-[2rem] border border-slate-50 shadow-sm">
          <Grid container spacing={5} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Applicant Name or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ color: 'text.disabled', mr: 1, fontSize: 20 }} />,
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={2}>
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
            <Grid item xs={12} sm={6} md={1.7}>
              <FormControl fullWidth size="small">
                <InputLabel>Final Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Final Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  sx={{ borderRadius: '12px' }}
                >
                  <MenuItem value="all">All Requests</MenuItem>
                  <MenuItem value="pending_acting">Pending Acting</MenuItem>
                  <MenuItem value="pending_approval">Pending Head</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={1.7}>
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
            <Grid item xs={12} md={1.6}>
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
        </Paper>
      )}

      {requests.length === 0 ? (
        <Paper className="glass-card p-12 text-center rounded-[2rem]">
          <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            No leave requests found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden shadow-sm">
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell className="font-bold">Applicant</TableCell>
                <TableCell className="font-bold" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Summary</TableCell>
                <TableCell className="font-bold">Acting Status</TableCell>
                <TableCell className="font-bold text-center" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>Final Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" className="text-slate-400 font-bold italic">No records match your filters.</Typography>
                  </TableCell>
                </TableRow>
              ) : paginatedRequests.map((req) => (
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
                    <Box className="flex items-center gap-3">
                      <Avatar 
                        src={req.applicantId?.profilePicture ? `${ASSET_BASE}${req.applicantId.profilePicture}` : undefined} 
                        sx={{ 
                          display: { xs: 'none', sm: 'flex' }, 
                          bgcolor: siteConfig.colors.primary 
                        }}
                      >
                        {req.applicantId?.firstName?.[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" className="font-bold">
                          {req.applicantId?.firstName} {req.applicantId?.lastName}
                        </Typography>
                        <Typography variant="caption" className="text-slate-500">
                          {req.applicantId?.department}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip label={req.leaveType} size="small" variant="outlined" sx={{ fontWeight: 600, mb: 0.5 }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {formatDate(req.dateRange.from)} - {formatDate(req.dateRange.to)}
                    </Typography>
                    <Typography variant="caption" className="font-bold" >
                      {req.totalDays} Total Days
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', items: 'center', gap: 1 }}>
                        {getActingStatusChip(req.actingOfficerStatus)}
                      </Box>
                      {req.actingOfficerDecisionDate && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                          {formatShortDateTime(req.actingOfficerDecisionDate)}
                        </Typography>
                      )}
                      <Typography variant="caption" display="block" sx={{ fontWeight: 500, fontSize: '0.65rem' }}>
                        by {req.actingOfficerId?.firstName} {req.actingOfficerId?.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                      {getFinalStatusChip(req.status)}
                      {req.deptHeadDecisionDate && (
                        <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'text.secondary' }}>
                          {formatShortDateTime(req.deptHeadDecisionDate)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
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
      )}

      {/* Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        fullWidth
        maxWidth="md"
        slotProps={{
          backdrop: {
            sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(15, 23, 42, 0.4)' }
          }
        }}
        PaperProps={{
          className: "glass-card rounded-[2rem]",
          sx: { p: 1 }
        }}
      >
        <DialogTitle className="font-black text-2xl flex justify-between items-center">
          Final Review
          <Box className="flex items-center gap-1">
            <IconButton 
              onClick={() => printLeaveApplication(selectedRequest, selectedRequest?.applicantId || {}, siteConfig)} 
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
              <Box className="flex items-center gap-4 mb-4">
                <Avatar 
                  src={selectedRequest.applicantId?.profilePicture ? `${ASSET_BASE}${selectedRequest.applicantId.profilePicture}` : undefined} 
                  sx={{ width: 60, height: 60, bgcolor: siteConfig.colors.primary }}
                >
                   {selectedRequest.applicantId?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" className="font-bold">{selectedRequest.applicantId?.firstName} {selectedRequest.applicantId?.lastName}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedRequest.applicantId?.department} Applicant</Typography>
                </Box>
              </Box>

              <Divider />

              <Box className="grid grid-cols-2 gap-4">
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Leave Type</Typography>
                  <Typography variant="body1" className="font-semibold">{selectedRequest.leaveType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Category</Typography>
                  <Typography variant="body1" className="font-semibold">{selectedRequest.category}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Duration</Typography>
                  <Typography variant="body2" className="font-semibold">
                    {formatDate(selectedRequest.dateRange.from)} - {formatDate(selectedRequest.dateRange.to)}
                  </Typography>
                  <Typography variant="caption" className="font-bold" >{selectedRequest.totalDays} Work Days</Typography>
                </Box>
                  <Box>
                    <Typography variant="caption" className="font-bold text-slate-400 uppercase">Acting Officer</Typography>
                    <Typography variant="body2" className="font-semibold">
                      {selectedRequest.actingOfficerId?.firstName} {selectedRequest.actingOfficerId?.lastName}
                    </Typography>
                    {getActingStatusChip(selectedRequest.actingOfficerStatus)}
                    {selectedRequest.actingOfficerDecisionDate && (
                      <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                        {formatDateTime(selectedRequest.actingOfficerDecisionDate)}
                      </Typography>
                    )}
                  </Box>
                </Box>
  
                {selectedRequest.status !== 'pending_approval' && (
                  <Box className="mt-4 p-4 rounded-2xl flex items-center justify-between" sx={{ bgcolor: selectedRequest.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: '1px solid', borderColor: selectedRequest.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                     <Box>
                        <Typography variant="caption" className="font-bold uppercase" sx={{ color: selectedRequest.status === 'approved' ? 'success.main' : 'error.main' }}>Final Decision</Typography>
                        <Typography variant="h6" className="font-black" sx={{ color: selectedRequest.status === 'approved' ? 'success.main' : 'error.main', textTransform: 'uppercase' }}>{selectedRequest.status}</Typography>
                        {selectedRequest.deptHeadDecisionDate && (
                          <Typography variant="caption" sx={{ fontWeight: 700, color: selectedRequest.status === 'approved' ? 'success.main' : 'error.main', opacity: 0.8 }}>
                            Decided: {formatDateTime(selectedRequest.deptHeadDecisionDate)}
                          </Typography>
                        )}
                     </Box>
                     <Chip label="FINALIZED" size="small" variant="filled" sx={{ fontWeight: 900, fontSize: '0.6rem', bgcolor: selectedRequest.status === 'approved' ? 'success.main' : 'error.main', color: 'white' }} />
                  </Box>
                )}

              {selectedRequest.rejectionReason && (
                <Box className="mt-4">
                  <Typography variant="caption" className="font-bold text-red-400 uppercase">Reason for Rejection</Typography>
                  <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(239, 68, 68, 0.02)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <Typography variant="body2" color="error.main" sx={{ fontWeight: 500 }}>{selectedRequest.rejectionReason}</Typography>
                  </Paper>
                </Box>
              )}

              <Box className="mt-4">
                <Typography variant="caption" className="font-bold text-slate-400 uppercase">Reason for Leave</Typography>
                <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(0,0,0,0.01)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
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
                        {selectedRequest.actingOfficerDecisionDate ? formatDateTime(selectedRequest.actingOfficerDecisionDate) : 'Awaiting approval'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 3: final */}
                  <Box className="flex gap-4 relative z-10">
                    <Box className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center shrink-0 ${
                      selectedRequest.status === 'approved' ? 'bg-emerald-500' : 
                      selectedRequest.status === 'rejected' ? 'bg-red-500' : 'bg-slate-200'
                    }`}>
                      <Box className="w-1.5 h-1.5 rounded-full bg-white" />
                    </Box>
                    <Box>
                      <Typography variant="body2" className="font-bold ">
                        Final Decision {selectedRequest.status !== 'pending' && selectedRequest.status !== 'pending_approval' && selectedRequest.status !== 'pending_acting' && `(${selectedRequest.status})`}
                      </Typography>
                      <Typography variant="caption" >
                        {selectedRequest.deptHeadDecisionDate ? formatDateTime(selectedRequest.deptHeadDecisionDate) : 
                         selectedRequest.actingOfficerStatus === 'rejected' ? 'Process terminated' : 'Pending your final review'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Box className="flex gap-2 w-full justify-between">
            <Box className="flex gap-2">
              {selectedRequest?.status === 'pending_approval' ? (
                <>
                  <Button 
                    variant="outlined" 
                    color="error"
                    disabled={submitting}
                    onClick={() => setRejectionDialogOpen(true)}
                    startIcon={<CancelIcon />}
                    sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
                  >
                    Reject Leave
                  </Button>
                  <Button 
                    variant="contained" 
                    disabled={submitting}
                    onClick={() => handleDecision(selectedRequest.id, 'approved')}
                    startIcon={<CheckCircleIcon />}
                    sx={{ 
                      bgcolor: siteConfig.colors.primary,
                      borderRadius: '12px', 
                      textTransform: 'none', 
                      fontWeight: 800,
                      px: 4
                    }}
                  >
                    Approve Leave
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outlined" 
                  onClick={handleCloseModal}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, py: 1.5 }}
                >
                  Close
                </Button>
              )}
            </Box>
            <Button 
              variant="outlined" 
              onClick={() => printLeaveApplication(selectedRequest, selectedRequest?.applicantId || {}, siteConfig)}
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

      {/* Rejection Reason Modal */}
      <Dialog 
        open={rejectionDialogOpen} 
        onClose={() => setRejectionDialogOpen(false)}
        maxWidth="xs"
        fullWidth
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
        <DialogTitle className="font-black text-xl">
          Reason for Rejection
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Please provide a brief explanation for rejecting <strong>{selectedRequest?.applicantId?.firstName}</strong>'s leave request. This will be sent to the applicant.
          </Typography>
          <TextField 
            fullWidth
            multiline
            rows={4}
            placeholder="Type reason here..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            slotProps={{
              input: {
                sx: { borderRadius: '15px' }
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setRejectionDialogOpen(false)} 
            sx={{ fontWeight: 700, borderRadius: '12px' }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            disabled={submitting || !rejectionReason.trim()}
            onClick={() => handleDecision(selectedRequest.id, 'rejected', rejectionReason)}
            sx={{ fontWeight: 800, borderRadius: '12px', px: 3 }}
          >
            Confirm Rejection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveApprovalDashboard;
