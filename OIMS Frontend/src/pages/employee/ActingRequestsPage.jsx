import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Button, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Avatar, IconButton, Divider, Backdrop
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import CloseIcon from '@mui/icons-material/Close';
import { leaveApi } from '../../api/leaveApi';
import { siteConfig } from '../../config/siteConfig';

const ActingRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const ASSET_BASE = import.meta.env.VITE_ASSET_URL || 'http://localhost:5000';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await leaveApi.getAllActing();
      if (res.data && res.data.success) {
        setRequests(res.data.data);
      }
    } catch (err) {
      setError('Failed to fetch acting requests.');
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

  const handleDecision = async (id, status) => {
    try {
      setSubmitting(true);
      const res = await leaveApi.approveActing(id, status);
      if (res.data && res.data.success) {
        // Dispatch event to update sidebar badges
        window.dispatchEvent(new CustomEvent('refreshPendingCounts'));
        handleCloseModal();
        fetchRequests(); // Refresh list
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
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
    <Box className="max-w-6xl mx-auto px-4 pb-12">
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 999, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0,0,0,0.2)' }}
        open={submitting}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Box className="mb-8">
        <Typography variant="h4" className="font-black tracking-tight mb-2" sx={{ color: 'var(--text-heading)' }}>
          Acting <span style={{ color: siteConfig.colors.primary }}>Requests</span>
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-muted)' }}>
          Review your acting nomination history and manage pending endorse requests.
        </Typography>
      </Box>

      {error && <Alert severity="error" className="mb-6 rounded-xl">{error}</Alert>}

      {requests.length === 0 ? (
        <Paper className="glass-card p-12 text-center rounded-[2rem]">
          <Typography variant="h6" sx={{ color: 'var(--text-muted)', fontWeight: 600 }}>
            No pending acting requests found.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="glass-card rounded-[2rem] overflow-hidden">
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
              <TableRow>
                <TableCell className="font-bold">Applicant</TableCell>
                <TableCell className="font-bold">Type</TableCell>
                <TableCell className="font-bold">Duration</TableCell>
                <TableCell className="font-bold text-center">Acting Officer</TableCell>
                <TableCell className="font-bold text-center">Approve Officer</TableCell>
                <TableCell className="font-bold" align="right">Actions</TableCell>
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
                        sx={{ bgcolor: siteConfig.colors.primary }}
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
                  <TableCell>
                    <Chip label={req.leaveType} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                    <Typography variant="caption" display="block" color="textSecondary">{req.category}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="font-medium">
                      {formatDate(req.dateRange.from)} - {formatDate(req.dateRange.to)}
                    </Typography>
                    <Typography variant="caption" className="font-bold" >
                      {req.totalDays} Work Days
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={req.actingOfficerStatus?.toUpperCase() || 'PENDING'} 
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
                    <Box className="flex justify-end gap-2">
                      <IconButton onClick={(e) => { e.stopPropagation(); handleOpenModal(req); }} sx={{ color: siteConfig.colors.primary }}>
                        <VisibilityIcon />
                      </IconButton>
                      {req.actingOfficerStatus === 'pending' && (
                        <>
                          <Button 
                            variant="contained" 
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleDecision(req.id, 'approved'); }}
                            disabled={submitting}
                            startIcon={<CheckCircleIcon />}
                            sx={{ 
                              bgcolor: siteConfig.colors.primary,
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 700
                            }}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outlined" 
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleDecision(req.id, 'rejected'); }}
                            disabled={submitting}
                            startIcon={<CancelIcon />}
                            sx={{ 
                              borderRadius: '10px',
                              textTransform: 'none',
                              fontWeight: 700
                            }}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Box>
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
          Request Details
          <IconButton onClick={handleCloseModal} sx={{ color: 'text.secondary' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box className="space-y-4 py-2">
              <Box className="flex items-center gap-4 mb-6">
                <Avatar 
                  src={selectedRequest.applicantId?.profilePicture ? `${ASSET_BASE}${selectedRequest.applicantId.profilePicture}` : undefined} 
                  sx={{ width: 60, height: 60, bgcolor: siteConfig.colors.primary, fontSize: 24 }}
                >
                  {selectedRequest.applicantId?.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" className="font-bold">{selectedRequest.applicantId?.firstName} {selectedRequest.applicantId?.lastName}</Typography>
                  <Typography variant="body2" color="textSecondary">{selectedRequest.applicantId?.department} Applicant</Typography>
                </Box>
              </Box>

              <Divider />

              <Box className="grid grid-cols-2 gap-4 mt-4">
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

              <Box className="mt-4">
                <Typography variant="caption" className="font-bold text-slate-400 uppercase">Contact Address While On Leave</Typography>
                <Paper sx={{ p: 2, mt: 1, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <Typography variant="body2">{selectedRequest.addressWhileOnLeave}</Typography>
                </Paper>
              </Box>

              <Box className="mt-4 p-4 rounded-2xl  border border-slate-200">
                <Typography variant="body2" className="text-slate-500 italic">
                  Note: Sensitive details like "Reason for Leave" and attached documents are only visible to the Department Head for privacy reasons.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3  }} >
          <Box className="flex gap-2 w-full justify-end">
            {selectedRequest?.actingOfficerStatus === 'pending' ? (
              <>
                <Button 
                  variant="outlined" 
                  color="error"
                  disabled={submitting}
                  onClick={() => handleDecision(selectedRequest.id, 'rejected')}
                  sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 800 }}
                >
                  Reject Request
                </Button>
                <Button 
                  variant="contained" 
                  disabled={submitting}
                  onClick={() => handleDecision(selectedRequest.id, 'approved')}
                  sx={{ 
                    bgcolor: siteConfig.colors.primary,
                    borderRadius: '12px', 
                    textTransform: 'none', 
                    fontWeight: 800,
                    px: 4
                  }}
                >
                  Approve Request
                </Button>
              </>
            ) : (
                <Chip 
                  label={`ALREADY ${selectedRequest?.actingOfficerStatus?.toUpperCase()}`} 
                  color={selectedRequest?.actingOfficerStatus === 'approved' ? 'success' : 'error'}
                  sx={{ fontWeight: 800, px: 2, py: 2 }}
                />
            )}
          </Box>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ActingRequestsPage;
