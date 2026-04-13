import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Backdrop, IconButton, Divider, Grid, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { leaveApi } from '../../api/leaveApi';
import { siteConfig } from '../../config/siteConfig';
import useAuthStore from '../../store/useAuthStore';

const MyLeaveDetailsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getMyLeaves();
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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
          My Leave <span style={{ color: siteConfig.colors.primary }}>Details</span>
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
          Track the status of your leave applications. You can modify or delete requests that have not yet been processed.
        </Typography>
      </Box>

      {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

      {requests.length === 0 ? (
        <Paper className="glass-card p-12 text-center rounded-[2rem]">
          <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            No leave requests found.
          </Typography>
          <Button 
            variant="contained" 
            sx={{ mt: 3, bgcolor: siteConfig.colors.primary, borderRadius: '12px', fontWeight: 700 }}
            onClick={() => navigate('/leaves/apply')}
          >
            Apply for Leave
          </Button>
        </Paper>
      ) : (
        /* Main Dual-Panel Layout matching MyProfilePage */
        <Box className="flex flex-col lg:flex-row items-start gap-10">
          
          {/* Main Content Area (Table) - Now on the left to match profile density */}
          <Box className="flex-1 w-full order-2 lg:order-1">
            <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden">
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
                  {requests.map((req) => {
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
                          <Chip 
                            label={req.actingOfficerStatus?.toUpperCase()} 
                            size="small" 
                            color={req.actingOfficerStatus === 'approved' ? 'success' : req.actingOfficerStatus === 'rejected' ? 'error' : 'warning'}
                            sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                          />
                        </TableCell>
                        <TableCell align="center">
                           {req.actingOfficerStatus === 'rejected' ? (
                               <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled' }}>----</Typography>
                            ) : (
                               <Chip 
                                 label={req.deptHeadStatus?.toUpperCase() || 'PENDING'} 
                                 size="small" 
                                 color={req.deptHeadStatus === 'approved' ? 'success' : req.deptHeadStatus === 'rejected' ? 'error' : 'warning'}
                                 sx={{ fontWeight: 800, fontSize: '0.65rem' }} 
                               />
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
            </TableContainer>
          </Box>

          {/* Sticky Summary Card Sidebar - Configured like Profile Sidebar but narrower */}
          <Box className="w-full lg:w-[300px] xl:w-[340px] lg:sticky top-24 z-10 shrink-0 order-1 lg:order-2">
            <Paper className="glass-card p-6 rounded-[2.5rem] border border-slate-50 shadow-xl overflow-hidden">
              <Box className="flex items-center gap-3 mb-6">
                <Box className="w-1.5 h-8 rounded-full" style={{ backgroundColor: siteConfig.colors.primary }} />
                <Box>
                  <Typography variant="h6" className="font-black" sx={{ color: 'var(--text-heading)' }}>Usage Summary</Typography>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase tracking-widest">{new Date().getFullYear()} Record</Typography>
                </Box>
              </Box>

              <Box className="mb-8 p-8 rounded-[2.5rem]  border border-indigo-100 text-center relative overflow-hidden group">
                <Box className="absolute top-0 right-0 w-24 h-24  rounded-full -mr-10 -mt-10 blur-2xl" />
                <Typography variant="h2" className="font-black uppercase text-indigo-400 tracking-tighter relative z-10">                 
                   {requests
                     .filter(l => l.status === 'approved' && new Date(l.dateRange.from).getFullYear() === new Date().getFullYear())
                     .reduce((sum, l) => sum + (l.totalDays || 0), 0)}</Typography>
                <Typography variant="caption" className="font-black uppercase text-indigo-400 tracking-tighter relative z-10">Approved Leaves Total</Typography>
                <Typography variant="h5" className="font-black  relative z-10">
                  {user?.annualLeaveBalance ?? 45} / 45
                </Typography>
              </Box>

              <Typography variant="subtitle2" className="font-black mb-4 px-2 uppercase text-[0.7rem] text-slate-400">By Leave Type</Typography>
              <List disablePadding className="space-y-3">
                {(() => {
                  const currentYear = new Date().getFullYear();
                  const approvedRequests = requests.filter(l => 
                    l.status === 'approved' && 
                    new Date(l.dateRange.from).getFullYear() === currentYear
                  );
                  const uniqueTypes = [...new Set(approvedRequests.map(l => l.leaveType))].sort();

                  return uniqueTypes.map(type => {
                    const count = approvedRequests.filter(l => l.leaveType === type).length;
                    const typeColors = { Annual: '#6366f1', Medical: '#10b981', Casual: '#f59e0b', Short: '#ec4899' };
                    const color = typeColors[type] || siteConfig.colors.primary;

                    return (
                      <ListItem 
                        key={type} 
                        className="rounded-2xl border border-transparent transition-all hover:border-slate-100 "
                        sx={{ py: 1.2, px: 2 }}
                      >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                          <Box className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={<Typography className="font-bold text-[0.85rem] text-slate-600">{type} Leave</Typography>} 
                        />
                        <Typography>{count}</Typography>
                      </ListItem>
                    );
                  });
                })()}
                {requests.filter(l => l.status === 'approved' && new Date(l.dateRange.from).getFullYear() === new Date().getFullYear()).length === 0 && (
                  <Typography variant="caption" className="text-slate-400 italic px-2">No approved records yet.</Typography>
                )}
              </List>
              
              <Divider className="my-6" sx={{ borderStyle: 'dashed', opacity: 0.5 }} />
              
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
            </Paper>
          </Box>
        </Box>
      )}

      {/* Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
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
          <IconButton onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
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

              {selectedRequest.attachments && (
                <Box className="mt-4">
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Supporting Documents</Typography>
                  <Box className="mt-2 flex flex-col gap-2">
                    <Paper 
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
                      onClick={() => window.open(`${import.meta.env.VITE_ASSET_URL}${selectedRequest.attachments}`, '_blank')}
                    >
                      <Box className="flex items-center gap-2 overflow-hidden">
                        <Box sx={{ color: siteConfig.colors.primary }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {selectedRequest.attachments.split('/').pop()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: siteConfig.colors.primary, fontWeight: 700, whiteSpace: 'nowrap', ml: 2 }}>
                        OPEN
                      </Typography>
                    </Paper>
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
                </Box>
                <Box>
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Department Head</Typography>
                  <Typography variant="body2" className="font-semibold">
                    {selectedRequest.approveOfficerId?.firstName} {selectedRequest.approveOfficerId?.lastName}
                  </Typography>
                  {selectedRequest.actingOfficerStatus === 'rejected' ? (
                       <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', mt: 1, display: 'block' }}>N/A</Typography>
                  ) : (
                    <Chip 
                      label={selectedRequest.deptHeadStatus?.toUpperCase() || 'PENDING'} 
                      size="small" 
                      color={selectedRequest.deptHeadStatus === 'approved' ? 'success' : selectedRequest.deptHeadStatus === 'rejected' ? 'error' : 'warning'}
                      sx={{ fontWeight: 800, fontSize: '0.65rem', mt: 1 }} 
                    />
                  )}
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
        {selectedRequest && selectedRequest.actingOfficerStatus === 'pending' && selectedRequest.deptHeadStatus === 'pending' && (
          <DialogActions sx={{ p: 3  }}>
            <Box className="flex gap-2 w-full justify-between">
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
            </Box>
          </DialogActions>
        )}
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
