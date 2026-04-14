# OIMS Technical Reference & API Map

Documentation for developers regarding the backend architecture, API routes, and security protocols.

---

## 🔐 Security & Authentication
- **Mechanism**: JSON Web Tokens (JWT) stored in HTTP-Only cookies.
- **Hashing**: All passwords hashed using `bcryptjs` with a cost factor of 12.
- **Middleware**: `protect` (verifies token) and `restrictTo` (verifies role).

### Roles & Permissions
| Role | Description | Capabilities |
| :--- | :--- | :--- |
| `EMPLOYEE` | Standard User | Manage leaves, view profile, view calendar. |
| `DEPT_HEAD` | Department Lead | Standard + Approve departmental leaves, view dept employees. |
| `TOP_ADMIN` | Management | Standard + Full visibility into all departments. |
| `ADMIN` | System Admin | Full access to settings, employee CRUD, and security. |

---

## 🛠 API Routes

### Authentication (`/api/v1/auth`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Public | Authenticate user and set cookie. |
| `POST` | `/forgot-password` | Public | Send recovery email. |
| `PATCH` | `/reset-password/:token` | Public | Update password using token. |
| `GET` | `/logout` | Private | Clear authentication cookie. |

### Employees (`/api/v1/employees`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | DEPT_HEAD+ | List employees (scoped by dept if not Admin). |
| `POST` | `/` | ADMIN | Register a new employee with photo. |
| `GET` | `/me` | Private | Get currently logged-in user profile. |
| `GET` | `/:id` | Private | Get specific employee details. |
| `PATCH` | `/:id` | ADMIN | Update employee records. |
| `POST` | `/:id/recovery` | ADMIN | Manually trigger recovery email for user. |

### Leaves (`/api/v1/leaves`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/apply` | Private | Submit leave request with attachments. |
| `GET` | `/my-requests` | Private | Get user's personal leave history. |
| `GET` | `/acting-requests` | Private | Get requests where user is the Acting Officer. |
| `POST` | `/:id/acting-decision` | Private | Accept/Reject acting responsibility. |
| `POST` | `/:id/approve` | DEPT_HEAD+ | Final approval/rejection of leave. |
| `GET` | `/calendar` | Private | Get approved leaves for calendar display. |
| `GET` | `/dashboard-summary` | Private | Get "Today" and "Upcoming" data. |

### Settings (`/api/v1/settings`)
| Method | Route | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | ADMIN | Fetch all global system configurations. |
| `PATCH` | `/` | ADMIN | Update global settings. |
| `POST` | `/sync-balances` | ADMIN | Push global leave balance to all users. |
| `POST` | `/test-reminders` | ADMIN | Manually trigger reminder polling. |

---

## 📊 Data Models (Mongoose)

### User
Core identity and employment details. Includes `annualLeaveBalance` and role-based fields.

### LeaveRequest
Tracks `applicantId`, `actingOfficerId`, and `dateRange`. Includes multi-stage status (`pending`, `acting_approved`, `approved`, `rejected`).

### SystemSettings
Single document storing global configurations: `leaveTypes`, `departments`, `timezone`, `emailNotifications` (matrix), and `leaveReminders`.

---

## 📨 Internal Logic: Reminder System
The `reminderService.mjs` operates as a specialized worker:
1. **Target Identification**: Calculates the date based on `dayOffset`.
2. **Overlap Query**: Finds all leaves active on that date using `$lte` / `$gte` logic.
3. **Dispatch**: Sends departmental digests and direct personal reminders to acting officers.
