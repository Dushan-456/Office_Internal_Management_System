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
import Notification from "../models/Notification.mjs";
import { emitToUser } from "../utils/socket.mjs";
import SystemSettings from "../models/SystemSettings.mjs";

const sendNotification = async (recipientId, senderId, type, message, link = "") => {
  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type,
      message,
      link
    });
    // Emit real-time event
    emitToUser(recipientId, "notification", notification);
    return notification;
  } catch (error) {
    console.error("Failed to send notification:", error);
  }
};

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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Submit a new leave application and notify the acting officer
  * @route           POST /api/v1/leaves/apply
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

    const attachments = req.files && req.files.length > 0 
      ? req.files.map(f => `/uploads/leaves/${f.filename}`) 
      : [];

    // Validate balance before creating the request
    const applicant = await User.findById(applicantId);
    if (!applicant) {
      return res.status(404).json({ success: false, message: "Applicant profile not found." });
    }

    const leaveYear = new Date(fromDate).getFullYear();
    const balanceRecord = applicant.leaveBalances?.find(b => b.year === leaveYear);
    const availableBalance = balanceRecord ? balanceRecord.annualBalance : 0;

    if (availableBalance < totalDays) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient leave balance for year ${leaveYear}. Requested: ${totalDays}, Available: ${availableBalance}.` 
      });
    }

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
    
    // Fetch settings for email toggles
    const settings = await SystemSettings.findOne();
    const emailToggles = settings?.emailNotifications?.onApply || { applicant: true, actingOfficer: true };

    // Send email to Acting Officer
    if (emailToggles.actingOfficer && actingOfficer && actingOfficer.email) {
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
    if (emailToggles.applicant && req.user.email) {
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;
      const html = getLeaveApplicationConfirmationTemplate(
        req.user.firstName,
        actingOfficer ? `${actingOfficer.firstName} ${actingOfficer.lastName}` : "Acting Officer",
        statusUrl,
        fromDate,
        toDate
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

    // --- Real-time Notification ---
    sendNotification(
      actingOfficerId,
      applicantId,
      "LEAVE_APPLIED",
      `${req.user.firstName} ${req.user.lastName} has nominated you as Acting Officer for a leave request.`,
      "/leaves/acting"
    );
  } catch (error) {
    console.error("Apply Leave Error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Endorse or decline an acting role nomination by an applicant
  * @route           PATCH /api/v1/leaves/acting-approve/:id
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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
    leaveRequest.actingOfficerDecisionDate = Date.now();
    
    // Fetch settings for email toggles
    const settings = await SystemSettings.findOne();
    const emailToggles = settings?.emailNotifications?.onActingDecision || { applicant: true, actingOfficer: true, approver: true };

    if (status === "approved") {
      leaveRequest.status = "pending_approval";
      
      const deptHead = leaveRequest.approveOfficerId;
      const applicant = leaveRequest.applicantId;
      const actingOfficer = await User.findById(actingUserId);
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;

      // 1. Send email to Dept Head
      if (emailToggles.approver && deptHead && deptHead.email) {
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
      if (emailToggles.applicant && applicant && applicant.email) {
        const html = getActingOfficerApprovalApplicantTemplate(
          applicant.firstName,
          `Acting Officer (${actingOfficer ? actingOfficer.firstName : 'Assigned Member'})`,
          statusUrl,
          leaveRequest.dateRange.from,
          leaveRequest.dateRange.to
        );
        emailService.sendHtmlEmail(
          applicant.email,
          "Leave Application Approved by Acting Officer",
          html
        ).catch(console.error);
      }

      // 3. Send confirmation email to Acting Officer
      if (emailToggles.actingOfficer && actingOfficer && actingOfficer.email) {
        const actingHtml = getActingOfficerApprovalConfirmationTemplate(
          actingOfficer.firstName,
          `${applicant.firstName} ${applicant.lastName}`,
          leaveRequest.dateRange.from,
          leaveRequest.dateRange.to
        );
        emailService.sendHtmlEmail(
          actingOfficer.email,
          "Acting Officer Approval Confirmed",
          actingHtml
        ).catch(console.error);
      }

    } else {
      leaveRequest.status = "rejected";
      
      const applicant = leaveRequest.applicantId;
      const actingOfficer = await User.findById(actingUserId);
      const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;

      // 1. Send rejection email to applicant
      if (emailToggles.applicant && applicant && applicant.email) {
         const html = getActingOfficerRejectionApplicantTemplate(
           applicant.firstName,
           `Acting Officer (${actingOfficer ? actingOfficer.firstName : 'Assigned Member'})`,
           statusUrl,
           leaveRequest.dateRange.from,
           leaveRequest.dateRange.to
         );
         emailService.sendHtmlEmail(
           applicant.email,
           "Leave Application Rejected by Acting Officer",
           html
         ).catch(console.error);
      }

      // 2. Send confirmation email to Acting Officer
      if (emailToggles.actingOfficer && actingOfficer && actingOfficer.email) {
        const actingHtml = getActingOfficerRejectionConfirmationTemplate(
          actingOfficer.firstName,
          `${applicant.firstName} ${applicant.lastName}`,
          leaveRequest.dateRange.from,
          leaveRequest.dateRange.to
        );
        emailService.sendHtmlEmail(
          actingOfficer.email,
          "Acting Officer Rejection Confirmed",
          actingHtml
        ).catch(console.error);
      }
    }

    await leaveRequest.save();

    // --- Real-time Notifications ---
    const applicant = leaveRequest.applicantId;
    const actingOfficer = await User.findById(actingUserId);
    
    if (status === "approved") {
      // Notify Applicant
      sendNotification(
        applicant._id,
        actingUserId,
        "ACTING_DECISION",
        `${actingOfficer.firstName} ${actingOfficer.lastName} (Acting) has endorsed your leave request.`,
        "/leaves/my-details"
      );
      // Notify Dept Head
      sendNotification(
        leaveRequest.approveOfficerId._id,
        actingUserId,
        "LEAVE_APPLIED",
        `${applicant.firstName} ${applicant.lastName}'s leave request is endorsed by Acting Officer and awaits your final approval.`,
        "/leaves/requests"
      );
    } else {
      // Notify Applicant of rejection
      sendNotification(
        applicant._id,
        actingUserId,
        "ACTING_DECISION",
        `${actingOfficer.firstName} ${actingOfficer.lastName} (Acting) has declined to act for your leave request.`,
        "/leaves/my-details"
      );
    }

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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Finalize leave request by Department Head (Approve/Reject)
  * @route           PATCH /api/v1/leaves/final-decision/:id
  * @access          Private (Dept Head)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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
    leaveRequest.deptHeadDecisionDate = Date.now();
    
    if (status === "rejected" && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    // --- Real-time Notifications ---
    const applicant = leaveRequest.applicantId;
    
    // Notify Applicant
    sendNotification(
      applicant._id,
      deptHeadId,
      "FINAL_DECISION",
      `Your leave request was ${status} by Department Head.`,
      "/leaves/my-details"
    );

    // Notify Acting Officer
    if (leaveRequest.actingOfficerId) {
      sendNotification(
        leaveRequest.actingOfficerId._id,
        deptHeadId,
        "FINAL_DECISION",
        `The leave request for ${applicant.firstName} ${applicant.lastName} you acted for has been ${status}.`,
        "/leaves/acting"
      );
    }

    // Deduct leave balance if approved
    if (status === "approved") {
      const applicantUser = await User.findById(applicant._id);
      const leaveYear = new Date(leaveRequest.dateRange.from).getFullYear();
      const balanceRecord = applicantUser?.leaveBalances?.find(b => b.year === leaveYear);
      const availableBalance = balanceRecord ? balanceRecord.annualBalance : 0;

      if (!applicantUser || availableBalance < leaveRequest.totalDays) {
        // Revert status if balance is suddenly insufficient
        leaveRequest.status = "pending_approval";
        leaveRequest.deptHeadStatus = "pending";
        await leaveRequest.save();
        
        return res.status(400).json({ 
          success: false, 
          message: `Approval failed. Applicant has insufficient leave balance (${availableBalance} days available).` 
        });
      }
      
      balanceRecord.annualBalance -= leaveRequest.totalDays;
      await applicantUser.save();
    }

    // --- Send final notification emails ---
    const applicantName = `${applicant.firstName} ${applicant.lastName}`;
    
    // Fetch settings for email toggles
    const settings = await SystemSettings.findOne();
    const emailToggles = settings?.emailNotifications?.onFinalDecision || { applicant: true, actingOfficer: true, approver: true };

    // 1. To Applicant
    if (emailToggles.applicant && applicant && applicant.email) {
        const statusUrl = `${process.env.FRONTEND_URL}/leaves/my-details`;
        const html = getLeaveFinalDecisionTemplate(
          applicant.firstName,
          status,
          statusUrl,
          leaveRequest.dateRange.from,
          leaveRequest.dateRange.to,
          "Department Head",
          leaveRequest.rejectionReason
        );
        emailService.sendHtmlEmail(applicant.email, "Leave Application Final Decision Update", html).catch(console.error);
    }

    // 2. To Acting Officer (Confirmation)
    const actingOfficer = leaveRequest.actingOfficerId;
    if (emailToggles.actingOfficer && actingOfficer && actingOfficer.email) {
      const actingHtml = getLeaveFinalDecisionConfirmationTemplate(
        actingOfficer.firstName,
        applicantName,
        status,
        leaveRequest.dateRange.from,
        leaveRequest.dateRange.to,
        leaveRequest.rejectionReason
      );
      emailService.sendHtmlEmail(actingOfficer.email, "Leave Decision Finalized", actingHtml).catch(console.error);
    }

    // 3. To Department Head (Reviewer Confirmation)
    const deptHead = leaveRequest.approveOfficerId;
    if (emailToggles.approver && deptHead && deptHead.email) {
      const dhHtml = getLeaveFinalDecisionConfirmationTemplate(
        deptHead.firstName,
        applicantName,
        status,
        leaveRequest.dateRange.from,
        leaveRequest.dateRange.to,
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Withdraw/Delete a pending leave request
  * @route           DELETE /api/v1/leaves/:id
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Update/Edit an existing pending leave request
  * @route           PUT /api/v1/leaves/:id
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

    // Validate balance if the total days are changing or it's a new check
    const applicant = await User.findById(req.user.id);
    const leaveYear = new Date(fromDate).getFullYear();
    const balanceRecord = applicant.leaveBalances?.find(b => b.year === leaveYear);
    const availableBalance = balanceRecord ? balanceRecord.annualBalance : 0;

    if (availableBalance < totalDays) {
       return res.status(400).json({ 
         success: false, 
         message: `Insufficient leave balance for this update year ${leaveYear}. Requested: ${totalDays}, Available: ${availableBalance}.` 
       });
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

    if (req.files && req.files.length > 0) {
      const newAttachments = req.files.map(f => `/uploads/leaves/${f.filename}`);
      updates.attachments = newAttachments;
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get all leave requests for the currently logged-in applicant
  * @route           GET /api/v1/leaves/my-requests
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get leave requests where the user is nominated as Acting Officer (Pending decision)
  * @route           GET /api/v1/leaves/pending-acting
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get all leave requests (history) where the user was nominated as Acting Officer
  * @route           GET /api/v1/leaves/all-acting
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get leave requests awaiting final approval from the Department Head
  * @route           GET /api/v1/leaves/pending-approval
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getPendingApprovalRequests = async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ approveOfficerId: req.user.id, status: "pending_approval" })
      .populate("applicantId", "firstName lastName department profilePicture")
      .populate("actingOfficerId", "firstName lastName")
      .populate("approveOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    console.error("Get Pending Approval Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get the count of active pending leave requests for the logged-in user
  * @route           GET /api/v1/leaves/my-pending-count
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get all leave requests (filtered by department for Dept Heads)
  * @route           GET /api/v1/leaves/all
  * @access          Private (Admin, DeptHead)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getAllLeaveRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === "ADMIN" || req.user.role === "TOP_ADMIN" || req.user.role === "DEPT_HEAD") {
      // These roles only see requests where they are the designated Approve Officer
      filter.approveOfficerId = req.user.id;
      // Usually, approvers only act after the Acting Officer has approved
      // But we show 'all' history for themselves, so we might not want to enforce acting status here
      // if they want to see what's coming their way. 
      // However, for consistency with the previous logic:
      filter.actingOfficerStatus = "approved";
    }
    const requests = await LeaveRequest.find(filter)
      .populate("applicantId", "firstName lastName department profilePicture employeeNo epfNo mobileNo jobTitle")
      .populate("actingOfficerId", "firstName lastName")
      .populate("approveOfficerId", "firstName lastName")
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get the leave history of a specific employee
  * @route           GET /api/v1/leaves/employee/:userId
  * @access          Private (Admin, DeptHead)
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getEmployeeLeaveHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const filter = { applicantId: userId };
    
    // If Dept Head, restrict to only endorsed requests
    if (req.user.role === "DEPT_HEAD") {
      filter.actingOfficerStatus = "approved";
    }
    // TOP_ADMIN and ADMIN see the full history including pending_acting

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

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get all approved leaves formatted for FullCalendar display
  * @route           GET /api/v1/leaves/calendar
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getCalendarData = async (req, res) => {
  try {
    const filter = { status: "approved" };

    // If not ADMIN or TOP_ADMIN, filter by current user's department
    if (req.user.role !== "ADMIN" && req.user.role !== "TOP_ADMIN") {
      const departmentUsers = await User.find({ department: req.user.department }).select("_id");
      const userIds = departmentUsers.map(u => u._id);
      filter.applicantId = { $in: userIds };
    }

    const leaves = await LeaveRequest.find(filter)
      .populate("applicantId", "firstName lastName department profilePicture")
      .select("applicantId leaveType category dateRange totalDays");

    // Standardize for FullCalendar
    const events = leaves.map(leave => {
      const endDate = new Date(leave.dateRange.to);
      endDate.setDate(endDate.getDate() + 1); // FullCalendar end is exclusive

      return {
        id: leave._id,
        title: `${leave.applicantId.firstName} ${leave.applicantId.lastName} - ${leave.leaveType}`,
        start: leave.dateRange.from,
        end: endDate,
        allDay: true,
        extendedProps: {
          department: leave.applicantId.department,
          leaveType: leave.leaveType,
          category: leave.category,
          actualEnd: leave.dateRange.to, // Keep original for display
          totalDays: leave.totalDays,
          profilePicture: leave.applicantId.profilePicture
        }
      };
    });

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    console.error("Get Calendar Data Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------------------
  * @description     Get departmental leave summary for the dashboard (Today & Upcoming 14 days)
  * @route           GET /api/v1/leaves/dashboard-summary
  * @access          Private
  ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
export const getDashboardLeaves = async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    const visibility = settings?.dashboardLeaveVisibility || "ALL";

    // Visibility Logic: If restricted, only ADMIN and DEPT_HEAD can see the full list
    if (visibility === "DEPT_HEAD_ONLY" && req.user.role === "EMPLOYEE") {
      return res.status(200).json({ 
        success: true, 
        message: "Visibility restricted to Department Heads only.",
        data: { today: [], upcoming: [] }
      });
    }

    const tz = settings?.timezone || "Asia/Colombo";
    
    // Get current date string in the target timezone (YYYY-MM-DD)
    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: tz });
    const today = new Date(`${todayStr}T00:00:00Z`);

    const next14Days = new Date(today);
    next14Days.setDate(today.getDate() + 15);
    const next14Str = next14Days.toISOString().split('T')[0];

    // Filter by department (Skip for ADMIN and TOP_ADMIN)
    let userIds;
    if (req.user.role === "ADMIN" || req.user.role === "TOP_ADMIN") {
      // Global visibility
      const allUsers = await User.find({}).select("_id");
      userIds = allUsers.map(u => u._id);
    } else {
      const userDept = req.user.department;
      const departmentUsers = await User.find({ department: userDept }).select("_id");
      userIds = departmentUsers.map(u => u._id);
    }

    // Fetch leaves that overlap with [today, today + 14]
    const leaves = await LeaveRequest.find({
      status: "approved",
      applicantId: { $in: userIds },
      $or: [
        // Starts on or before today and ends on or after today (Today)
        { "dateRange.from": { $lte: next14Days }, "dateRange.to": { $gte: today } }
      ]
    })
    .populate("applicantId", "firstName lastName profilePicture department")
    .sort({ "dateRange.from": 1 });

    const todayLeaves = leaves.filter(l => {
      const from = l.dateRange.from.toISOString().split('T')[0];
      const to = l.dateRange.to.toISOString().split('T')[0];
      return from <= todayStr && to >= todayStr;
    });

    const upcomingLeaves = leaves.filter(l => {
      const from = l.dateRange.from.toISOString().split('T')[0];
      const to = l.dateRange.to.toISOString().split('T')[0];
      // Include if it starts in the future OR it's currently active but continues into the future
      return from > todayStr || (from <= todayStr && to > todayStr);
    });

    res.status(200).json({
      success: true,
      data: {
        today: todayLeaves,
        upcoming: upcomingLeaves
      }
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
