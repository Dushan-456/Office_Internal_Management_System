# OIMS Feature Guide: Detailed System Operations

Welcome to the comprehensive guide for the Office Internal Management System (OIMS). This document provides a step-by-step breakdown of how every module works, including the underlying logic and automated workflows.

---

## 📅 The Leave Lifecycle

OIMS uses a multi-stage authorization protocol to ensure operational continuity.

### Phase A: Application Submission
**User Action**: An employee navigates to `Leaves -> Apply Leave`.
1. **Details**: The user selects a **Leave Type** (Casual, Medical, etc.) and a **Category** (Full Day / Half Day).
2. **Date Range**: Selection of start and end dates. The system automatically calculates total days, excluding weekends (configurable in settings).
3. **Acting Officer**: Mandatory selection of a colleague to handle responsibilities.
4. **Attachments**: Optional upload of supporting documents.
5. **Validation**: The system cross-references the requested days against the user's current `annualLeaveBalance`.

**📬 Email Flow (Phase A)**:
- **Applicant**: Receives a "Submission Confirmation" email with a summary of their request.
- **Acting Officer**: Receives an "Acting Responsibility Invitation." This email contains the applicant's name, dates, and a direct link to accept or reject the duty.

---

### Phase B: Acting Officer Proxy Handover
**User Action**: The Acting Officer navigates to `Leaves -> Acting Requests`.
1. **Decision**: The Acting Officer reviews the request. They must either **Accept** or **Decline**.
2. **Logic**: The request remains in a `pending` state until this decision is made. It is NOT visible to the Final Approver until the Acting Officer accepts.

**📬 Email Flow (Phase B)**:
- **Applicant**: Receives a status update informing them whether their colleague accepted or declined to act.
- **Final Approver (Dept Head)**: Triggered ONLY once the Acting Officer accepts. The Admin or Dept Head receives an "Approval Required" alert.

---

### Phase C: Final Authorization
**User Action**: An Admin or Dept Head navigates to `Leaves -> Approval Dashboard`.
1. **Review**: The approver sees the full details, including confirmation that an Acting Officer is assigned and ready.
2. **Decision**: Final **Approve** or **Reject**.
3. **Execution**: Upon approval:
    - The `annualLeaveBalance` is deducted.
    - The leave is added to the **Organizational Calendar**.
    - The employee is added to the **Who's Away** tracking lists.

**📬 Email Flow (Phase C)**:
- **Applicant**: Receives the "Final Decision" email (Approved/Rejected) with any comments from the approver.
- **Acting Officer**: Receives a notification informing them the leave they are covering for is now officially approved.
- **Internal Record**: A copy of the approval is sent to the system administrator for the digital audit trail.

---

## 🔔 Automated Notification Hub

### 1. The Notification Matrix
Located in `Admin -> Settings`, this grid allows administrators to toggle email alerts for every trigger mentioned above. This ensures the system remains quiet or highly communicative based on office policy.

### 2. Daily Absence Briefings
The `reminderService.mjs` runs automated background tasks to keep the department informed:
- **Departmental Digest**: Sends a consolidated list of everyone away **today**, **tomorrow**, or **on a specific date** to all employees in that department.
- **Acting Officer Reminders**: A secondary, personalized email sent directly to the Acting Officer on the day they are scheduled to start covering. 

> [!TIP]
> **Manual Testing**: Admins can use the **Play (Run Test Now)** icon next to any reminder rule in Settings to immediately trigger these emails for verification.

---

## ⚙️ Administrative Command Center

### 1. Dynamic Organizational Schema
Admins can customize the core building blocks of the office without writing any code:
- **Departments**: Add or delete organizational units. Dropdowns across the app (Registration, Filters) update in real-time.
- **Leave Types**: Manage the "Casual," "Medical," etc., list.
- **Leave Categories**: Define "Full Day," "Half Day," or custom categories like "Short Leave."

### 2. Stability & Logistics
- **System Timezone**: A global setting (e.g., `Asia/Colombo`) ensuring that "Today" logic remains consistent regardless of server location.
- **Grace Period**: Configure how many days an employee is allowed to "backdate" a leave application after it has already started.
- **Global Sync**: A "Sync All Balances" button to push a baseline leave allowance (e.g., 45 days) to every single user in the database.

---

## 📊 Dashboard & UX

### 1. "Who's Away" Intelligence
- **Real-time Status**: High-impact cards showing who is currently out of the office.
- **Multi-day Persistence**: Employees on leave for multiple days (e.g., Apr 14-17) will persist in this list for the entire duration.
- **Upcoming Away Sidebar**: A specialized list in the Calendar view showing absences for the next 14 days, including total duration and return dates.

### 2. Premium Design (Glassmorphism)
OIMS uses a state-of-the-art visual language:
- **Frosted Glass**: UI elements use `backdrop-filter` for a premium, modern feel.
- **Ambient Lighting**: Subtle background glow effects that respond to system themes.
- **Micro-animations**: Smooth transitions (using Framer Motion) for all page entries and status updates.

---

## 👤 Employee Self-Service

### 1. Professional Profiles
Employees can maintain a complete digital identity, including:
- **Academic Qualifications**: Tracking from GCE O/L up to PHD.
- **Employment Registry**: View official Employee Number, EPF/ETF numbers, and NIC details.

### 2. Password Recovery Protocols
- **Self-Service**: Reset via a secure, time-limited token sent to the registered email.
- **Admin Trigger**: Admins can manually send a "Recovery Link" to any employee's inbox with one click from the `All Employees` list.
