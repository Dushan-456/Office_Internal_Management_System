import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Error404Page from "../pages/Error404Page";
import ProtectedRouter from "./ProtectedRouter";
import LoginPage from "../pages/LoginPage";

// Pages
import DashboardPage from "../pages/admin/DashboardPage";
import AddEmployeePage from "../pages/admin/AddEmployeePage";
import AllEmployeesPage from "../pages/admin/AllEmployeesPage";
import EmployeeProfilePage from "../pages/admin/EmployeeProfilePage";
import MyProfilePage from "../pages/employee/MyProfilePage";
import EditEmployeePage from "../pages/admin/EditEmployeePage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import MandatoryPasswordChangePage from "../pages/MandatoryPasswordChangePage";

// Leave Pages
import LeaveApplicationForm from "../pages/employee/LeaveApplicationForm";
import ActingRequestsPage from "../pages/employee/ActingRequestsPage";
import MyLeaveDetailsPage from "../pages/employee/MyLeaveDetailsPage";
import LeaveApprovalDashboard from "../pages/admin/LeaveApprovalDashboard";
import LeaveCalendarPage from "../pages/employee/LeaveCalendarPage";
import SystemSettingsPage from "../pages/admin/SystemSettingsPage";
import MyAttendancePage from "../pages/employee/MyAttendancePage";
import AdminAttendancePage from "../pages/admin/AdminAttendancePage";
import OTCalculatorPage from "../pages/employee/OTCalculatorPage";
import ComingSoon from "../components/ComingSoon";

const router = createBrowserRouter([
  // ... Login Routes (omitted for brevity)
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/reset-password/:token",
    element: <ResetPasswordPage />,
  },

  // --- All authenticated routes wrapped in MainLayout ---
  {
    element: <ProtectedRouter />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          // --- Global Dashboard ---
          { index: true, element: <DashboardPage /> },
          { path: "change-password-mandatory", element: <MandatoryPasswordChangePage /> },

          // --- Admin Only Area ---
          {
            path: "admin",
            element: <ProtectedRouter ProtectedRole="ADMIN" />,
            children: [
              { path: "settings", element: <SystemSettingsPage /> },
              { path: "attendance/upload", element: <AdminAttendancePage /> },
            ]
          },

          // --- Employee Management ---
          {
            path: "employees",
            element: <ProtectedRouter ProtectedRole={["DEPT_HEAD", "TOP_ADMIN"]} />,
            children: [
              { index: true, element: <AllEmployeesPage /> },
              {
                path: "add",
                element: <ProtectedRouter ProtectedRole="ADMIN"><AddEmployeePage /></ProtectedRouter>
              },
              {
                path: "edit/:id",
                element: <ProtectedRouter ProtectedRole="ADMIN"><EditEmployeePage /></ProtectedRouter>
              },
              {
                path: ":id",
                children: [
                  { index: true, element: <EmployeeProfilePage /> },
                  { path: "attendance", element: <MyAttendancePage /> },
                  { path: "leaves", element: <MyLeaveDetailsPage /> },
                ]
              },
            ]
          },
          // ... rest of routes
          { path: "my-profile", element: <MyProfilePage /> },
          {
            path: "leaves",
            children: [
              { path: "apply", element: <LeaveApplicationForm /> },
              { path: "acting", element: <ActingRequestsPage /> },
              { path: "requests", element: <ProtectedRouter ProtectedRole={["DEPT_HEAD", "TOP_ADMIN"]}><LeaveApprovalDashboard /></ProtectedRouter> },
              { path: "my-details", element: <MyLeaveDetailsPage /> },
              { path: "calendar", element: <LeaveCalendarPage /> }
            ]
          },
          {
            path: "attendance",
            children: [
              { path: "my-details", element: <MyAttendancePage /> }
            ]
          },
          { path: "ot-calculator", element: <OTCalculatorPage /> },
          { path: "vehicle-request", element: <ComingSoon title="Vehicle Request Coming Soon" /> },
          { path: "*", element: <Error404Page /> },
        ],
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
