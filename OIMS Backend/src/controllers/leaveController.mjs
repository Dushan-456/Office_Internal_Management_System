import LeaveRequest from "../models/LeaveRequest.mjs";
import User from "../models/User.mjs";
import emailService from "../services/emailService.mjs";
import {
  getLeaveRequestActingTemplate,
  getLeaveNotifyDeptHeadTemplate,
  getLeaveFinalDecisionTemplate,
  getLeaveFinalDecisionConfirmationTemplate,
  getLeaveApplicationConfirmationTemplate,
  getActingOfficerRejectionApplicantTemplate,
  getActingOfficerRejectionConfirmationTemplate,
  getActingOfficerApprovalApplicantTemplate,
  getActingOfficerApprovalConfirmationTemplate,
  getLeaveDeletionNotificationTemplate
} from "../templates/leaveEmailTemplates.mjs";
import path from "path";

// Helper for total days excluded weekends
const calculateTotalDays = (fromDate, toDate) => {
  let count = 0;
  const curDate = new Date(fromDate);
  const endDate = new Date(toDate);
  curDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0=Sun, 6=Sat
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  return count;
};

export const applyLeave = async (req, res) => {
  try {
    const {
      leaveType,
      category,
      fromDate,
      toDate,
      addressWhileOnLeave,
      reason,
      actingOfficerId,
      approveOfficerId,
    } = req.body;

    const applicantId = req.user.id; // from protect middleware
    
    // Auto calculate days on backend as well just to be secure
    let totalDays = calculateTotalDays(fromDate, toDate);
    if (category === "Half Day") {
      totalDays = 0.5; // override for half day if needed
    }

    const attachments = req.file ? `/uploads/leaves/${req.file.filename}` : null;

    const newRequest = await LeaveRequest.create({
      applicantId,
      leaveType,
      category,
      dateRange: { from: new Date(fromDate), to: new Date(toDate) },
      totalDays,
      addressWhileOnLeave,
      reason,
      actingOfficerId,
      approveOfficerId,
      status: "pending_acting",
      attachments,
    });

    // Populate for email
    const actingOfficer = await User.findById(actingOfficerId);
    
    // Send email to Acting Officer
    if (actingOfficer && actingOfficer.email) {
      const actingUrl = `${process.env.FRONTEND_URL}/leaves/acting`;
      const html = getLeaveRequestActingTemplate(
        actingOfficer.firstName,
        `${req.user.firstName} ${req.user.lastName}`,
        actingUrl,
        fromDate,
        toDate
      );
      await emailService.sendHtmlEmail(
        actingOfficer.email,
        "Action Required: Leave Approval",
        html
      );
    }

    // Send confirmation email to Applicant
    if (req.user.email) {
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;
      const html = getLeaveApplicationConfirmationTemplate(
        req.user.firstName,
        actingOfficer ? `${actingOfficer.firstName} ${actingOfficer.lastName}` : "Acting Officer",
        statusUrl
      );
      await emailService.sendHtmlEmail(
        req.user.email,
        "Leave Application Submitted",
        html
      );
    }

    res.status(201).json({
      success: true,
      message: "Leave application submitted successfully.",
      data: newRequest,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const approveActing = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status } = req.body; // 'approved' or 'rejected'
    const actingUserId = req.user.id;

    const leaveRequest = await LeaveRequest.findById(leaveId)
      .populate("applicantId")
      .populate("approveOfficerId");

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leaveRequest.actingOfficerId.toString() !== actingUserId) {
      return res.status(403).json({ success: false, message: "Unauthorized. You are not the acting officer for this request." });
    }

    if (leaveRequest.status !== "pending_acting") {
      return res.status(400).json({ success: false, message: "Request is not in pending acting state." });
    }

    leaveRequest.actingOfficerStatus = status;
    
    if (status === "approved") {
      leaveRequest.status = "pending_approval";
      
      const deptHead = leaveRequest.approveOfficerId;
      const applicant = leaveRequest.applicantId;
      const actingOfficer = await User.findById(actingUserId);
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;

      // 1. Send email to Dept Head
      if (deptHead && deptHead.email) {
        const approvalUrl = `${process.env.FRONTEND_URL}/leaves/requests`;
        const html = getLeaveNotifyDeptHeadTemplate(
          deptHead.firstName,
          `${applicant.firstName} ${applicant.lastName}`,
          approvalUrl,
          leaveRequest.dateRange.from,
          leaveRequest.dateRange.to,
          `${actingOfficer ? actingOfficer.firstName : 'Assigned Member'} ${actingOfficer ? actingOfficer.lastName : ''}`
        );
        emailService.sendHtmlEmail(
          deptHead.email,
          "Leave Application Pending Final Approval",
          html
        ).catch(console.error);
      }

      // 2. Send Approval email to Applicant
      if (applicant && applicant.email) {
        const html = getActingOfficerApprovalApplicantTemplate(
          applicant.firstName,
          `Acting Officer (${actingOfficer ? actingOfficer.firstName : 'Assigned Member'})`,
          statusUrl
        );
        emailService.sendHtmlEmail(
          applicant.email,
          "Leave Application Approved",
          html
        ).catch(console.error);
      }

      // 3. Send confirmation email to Acting Officer
      if (actingOfficer && actingOfficer.email) {
        const actingHtml = getActingOfficerApprovalConfirmationTemplate(
          actingOfficer.firstName,
          `${applicant.firstName} ${applicant.lastName}`
        );
        emailService.sendHtmlEmail(
          actingOfficer.email,
          "Leave Approval Confirmed",
          actingHtml
        ).catch(console.error);
      }

    } else {
      leaveRequest.status = "rejected";
      
      const applicant = leaveRequest.applicantId;
      const actingOfficer = await User.findById(actingUserId);
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;

      // 1. Send rejection email to applicant
      if (applicant && applicant.email) {
         const html = getActingOfficerRejectionApplicantTemplate(
           applicant.firstName,
           `Acting Officer (${actingOfficer ? actingOfficer.firstName : 'Assigned Member'})`,
           statusUrl
         );
         emailService.sendHtmlEmail(
           applicant.email,
           "Leave Application Rejected",
           html
         ).catch(console.error);
      }

      // 2. Send confirmation email to Acting Officer
      if (actingOfficer && actingOfficer.email) {
        const actingHtml = getActingOfficerRejectionConfirmationTemplate(
          actingOfficer.firstName,
          `${applicant.firstName} ${applicant.lastName}`
        );
        emailService.sendHtmlEmail(
          actingOfficer.email,
          "Leave Rejection Confirmed",
          actingHtml
        ).catch(console.error);
      }
    }

    await leaveRequest.save();

    res.status(200).json({
      success: true,
      message: "Leave request approved by acting officer.",
      data: leaveRequest,
    });
  } catch (error) {
    console.error("Approve Acting Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const finalDecision = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const { status, rejectionReason } = req.body; // 'approved' or 'rejected'
    const deptHeadId = req.user.id;

    const leaveRequest = await LeaveRequest.findById(leaveId)
      .populate("applicantId")
      .populate("actingOfficerId")
      .populate("approveOfficerId");

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    // Role verification
    if (leaveRequest.approveOfficerId._id.toString() !== deptHeadId && req.user.role !== 'DEPT_HEAD' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    if (leaveRequest.status !== "pending_approval") {
      return res.status(400).json({ success: false, message: "Request is not in pending final approval state." });
    }

    leaveRequest.deptHeadStatus = status;
    leaveRequest.status = status;
    
    if (status === "rejected" && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    // Deduct leave balance if approved
    const applicant = leaveRequest.applicantId;
    if (status === "approved") {
      const applicantUser = await User.findById(applicant._id);
      if (applicantUser && applicantUser.annualLeaveBalance >= leaveRequest.totalDays) {
        applicantUser.annualLeaveBalance -= leaveRequest.totalDays;
        await applicantUser.save();
      }
    }

    // --- Send final notification emails ---
    const applicantName = `${applicant.firstName} ${applicant.lastName}`;

    // 1. To Applicant
    if (applicant && applicant.email) {
        const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;
        const html = getLeaveFinalDecisionTemplate(
          applicant.firstName,
          status,
          statusUrl,
          "Department Head",
          leaveRequest.rejectionReason
        );
        emailService.sendHtmlEmail(applicant.email, "Leave Application Final Decision Update", html).catch(console.error);
    }

    // 2. To Acting Officer (Confirmation)
    const actingOfficer = leaveRequest.actingOfficerId;
    if (actingOfficer && actingOfficer.email) {
      const actingHtml = getLeaveFinalDecisionConfirmationTemplate(
        actingOfficer.firstName,
        applicantName,
        status,
        leaveRequest.rejectionReason
      );
      emailService.sendHtmlEmail(actingOfficer.email, "Leave Decision Finalized", actingHtml).catch(console.error);
    }

    // 3. To Department Head (Reviewer Confirmation)
    const deptHead = leaveRequest.approveOfficerId;
    if (deptHead && deptHead.email) {
      const dhHtml = getLeaveFinalDecisionConfirmationTemplate(
        deptHead.firstName,
        applicantName,
        status,
        leaveRequest.rejectionReason
      );
      emailService.sendHtmlEmail(deptHead.email, "Action Confirmed: Leave Decision", dhHtml).catch(console.error);
    }

    res.status(200).json({
      success: true,
      message: `Leave request ${status} successfully.`,
      data: leaveRequest,
    });
  } catch (error) {
    console.error("Final Decision Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const deleteLeaveRequest = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const leaveRequest = await LeaveRequest.findById(leaveId)
      .populate("applicantId", "firstName lastName email")
      .populate("actingOfficerId", "firstName lastName email");

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leaveRequest.applicantId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized. You did not create this request." });
    }

    // Only allow deletion if both acting and dept head haven't processed it yet
    if (leaveRequest.actingOfficerStatus !== "pending" || leaveRequest.deptHeadStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Cannot delete request that has already been processed." });
    }

    const { applicantId, actingOfficerId, dateRange } = leaveRequest;
    const applicantName = `${applicantId.firstName} ${applicantId.lastName}`;

    await LeaveRequest.findByIdAndDelete(leaveId);

    // --- Send Deletion Emails ---
    
    // 1. To Applicant
    if (applicantId && applicantId.email) {
      const applicantHtml = getLeaveDeletionNotificationTemplate(
        applicantId.firstName,
        applicantName,
        dateRange.from,
        dateRange.to,
        true
      );
      emailService.sendHtmlEmail(applicantId.email, "Leave Request Deletion Confirmation", applicantHtml).catch(console.error);
    }

    // 2. To Acting Officer
    if (actingOfficerId && actingOfficerId.email) {
      const actingHtml = getLeaveDeletionNotificationTemplate(
        actingOfficerId.firstName,
        applicantName,
        dateRange.from,
        dateRange.to,
        false
      );
      emailService.sendHtmlEmail(actingOfficerId.email, "Notice: Nominated Acting Role Withdrawn", actingHtml).catch(console.error);
    }

    res.status(200).json({ success: true, message: "Leave request deleted successfully." });
  } catch (error) {
    console.error("Delete Leave Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const updateLeaveRequest = async (req, res) => {
  try {
    const leaveId = req.params.id;
    const {
      leaveType,
      category,
      fromDate,
      toDate,
      addressWhileOnLeave,
      reason,
      actingOfficerId,
      approveOfficerId,
    } = req.body;

    const leaveRequest = await LeaveRequest.findById(leaveId);

    if (!leaveRequest) {
      return res.status(404).json({ success: false, message: "Leave request not found" });
    }

    if (leaveRequest.applicantId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized. You did not create this request." });
    }

    // Only allow update if both acting and dept head haven't processed it yet
    if (leaveRequest.actingOfficerStatus !== "pending" || leaveRequest.deptHeadStatus !== "pending") {
      return res.status(400).json({ success: false, message: "Cannot edit request that has already been processed." });
    }

    let totalDays = calculateTotalDays(fromDate, toDate);
    if (category === "Half Day") {
      totalDays = 0.5;
    }

    const updates = {
      leaveType,
      category,
      dateRange: { from: new Date(fromDate), to: new Date(toDate) },
      totalDays,
      addressWhileOnLeave,
      reason,
      actingOfficerId,
      approveOfficerId,
    };

    if (req.file) {
      updates.attachments = `/uploads/leaves/${req.file.filename}`;
    }

    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      leaveId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: "Leave application updated successfully.",
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Update Leave Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

export const getMyLeaveRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ applicantId: req.user.id })
      .populate("actingOfficerId", "firstName lastName")
      .populate("approveOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Get My Leave Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPendingActingRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ actingOfficerId: req.user.id, status: "pending_acting" })
      .populate("applicantId", "firstName lastName department profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error("Get Pending Acting Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllActingRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ actingOfficerId: req.user.id })
      .populate("applicantId", "firstName lastName department profilePicture")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error("Get All Acting Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getPendingApprovalRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ approveOfficerId: req.user.id, status: "pending_approval" })
      .populate("applicantId", "firstName lastName department profilePicture")
      .populate("actingOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error("Get Pending Approval Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMyPendingCount = async (req, res) => {
  try {
    const count = await LeaveRequest.countDocuments({
      applicantId: req.user.id,
      status: { $in: ["pending_acting", "pending_approval"] }
    });
    res.status(200).json({ success: true, count });
  } catch (error) {
    console.error("Get My Pending Count Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAllLeaveRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "DEPT_HEAD") {
      // If dept head, only see requests assigned to them AND already approved by acting officer
      filter.approveOfficerId = req.user.id;
      filter.actingOfficerStatus = "approved";
    }
    const requests = await LeaveRequest.find(filter)
      .populate("applicantId", "firstName lastName department profilePicture")
      .populate("actingOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
export const getEmployeeLeaveHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const filter = { applicantId: userId };
    
    // If Dept Head, restrict to only endorsed requests
    if (req.user.role === "DEPT_HEAD") {
      filter.actingOfficerStatus = "approved";
    }

    // Fetch leaves for the targeted employee
    const requests = await LeaveRequest.find(filter)
      .populate("actingOfficerId", "firstName lastName")
      .populate("approveOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    console.error("Get Employee Leave History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
