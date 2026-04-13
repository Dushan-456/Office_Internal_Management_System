import api from "./axiosClient";

export const leaveApi = {
  // Submit a leave application
  applyLeave: (formData) => {
    return api.post('/leaves/apply', formData);
  },

  // Update a leave application
  updateLeave: (id, formData) => {
    return api.put(`/leaves/${id}`, formData);
  },

  // Delete a leave application
  deleteLeave: (id) => api.delete(`/leaves/${id}`),

  // Get current user's leave requests
  getMyLeaves: () => api.get('/leaves/my-requests'),

  // Get count of user's own pending requests
  getMyPendingCount: () => api.get('/leaves/my-pending-count'),

  // Get requests waiting for current user's acting approval
  getPendingActing: () => api.get('/leaves/pending-acting'),

  // Get all requests where current user was nominated as acting (including history)
  getAllActing: () => api.get('/leaves/all-acting'),

  // Get requests waiting for Dept Head's final approval
  getPendingApproval: () => api.get('/leaves/pending-approval'),

  // Get all leaves (for summary lists)
  getAllLeaves: () => api.get('/leaves/all'),

  // Get specific employee's leave history
  getEmployeeLeaves: (userId) => api.get(`/leaves/employee/${userId}`),

  // Acting officer sets to pending_approval or rejects
  approveActing: (id, status) => api.patch(`/leaves/acting-approve/${id}`, { status }),

  // Dept Head makes final decision
  finalDecision: (id, status, rejectionReason) => api.patch(`/leaves/final-decision/${id}`, { status, rejectionReason }),
};
