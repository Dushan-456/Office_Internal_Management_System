import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Avatar, IconButton, Divider, Backdrop, TextField
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { leaveApi } from '../../api/leaveApi';
import { siteConfig } from '../../config/siteConfig';

const LeaveApprovalDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
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
          Leave <span style={{ color: siteConfig.colors.primary }}>Requests</span>
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
          Review and manage all leave requests assigned to your department.
        </Typography>
      </Box>

      {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

      {requests.length === 0 ? (
        <Paper className="glass-card p-12 text-center rounded-[2rem]">
          <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            No leave requests found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden">
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell className="font-bold">Applicant</TableCell>
                <TableCell className="font-bold" sx={{ display: { xs: 'none', md: 'table-cell' } }}>Summary</TableCell>
                <TableCell className="font-bold">Acting Officer Status</TableCell>
                <TableCell className="font-bold">Approval Officer Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((req) => (
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
                    <Box className="flex items-center gap-2">
                      <Box sx={{ textAlign: 'left' }}>
                        {getActingStatusChip(req.actingOfficerStatus)}
                        <Typography variant="caption" display="block" sx={{ fontWeight: 500, fontSize: '0.7rem', mt: 0.5 }}>
                          by {req.actingOfficerId?.firstName} {req.actingOfficerId?.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {getFinalStatusChip(req.status)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Details Modal */}
      <Dialog 
        open={modalOpen} 
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
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
          <IconButton onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
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
                </Box>
              </Box>

              {selectedRequest.status !== 'pending_approval' && (
                <Box className="mt-4 p-4 rounded-2xl flex items-center justify-between" sx={{ bgcolor: selectedRequest.status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: '1px solid', borderColor: selectedRequest.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
                   <Box>
                      <Typography variant="caption" className="font-bold uppercase" sx={{ color: selectedRequest.status === 'approved' ? 'success.main' : 'error.main' }}>Final Decision</Typography>
                      <Typography variant="h6" className="font-black" sx={{ color: selectedRequest.status === 'approved' ? 'success.main' : 'error.main', textTransform: 'uppercase' }}>{selectedRequest.status}</Typography>
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

              {selectedRequest.attachments && (
                <Box className="mt-4">
                  <Typography variant="caption" className="font-bold text-slate-400 uppercase">Supporting Documents</Typography>
                  <Box className="mt-2">
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
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          {selectedRequest?.status === 'pending_approval' ? (
            <Box className="flex gap-2 w-full justify-between">
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
            </Box>
          ) : (
            <Button 
              fullWidth 
              variant="outlined" 
              onClick={handleCloseModal}
              sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800, py: 1.5 }}
            >
              Close
            </Button>
          )}
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
