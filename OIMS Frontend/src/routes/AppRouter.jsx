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

// Leave Pages
import LeaveApplicationForm from "../pages/employee/LeaveApplicationForm";
import ActingRequestsPage from "../pages/employee/ActingRequestsPage";
import MyLeaveDetailsPage from "../pages/employee/MyLeaveDetailsPage";
import LeaveApprovalDashboard from "../pages/admin/LeaveApprovalDashboard";
import ComingSoon from "../components/ComingSoon";

const router = createBrowserRouter([
  // --- Login Route (standalone, NO sidebar/layout) ---
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
          // --- Global Dashboard (Available to all, analytics Admin-only) ---
          { 
            index: true, 
            element: <DashboardPage /> 
          },

          // --- Unified Employee Management Hub ---
          {
            path: "employees",
            element: <ProtectedRouter ProtectedRole="DEPT_HEAD" />, // Base access for Dept Head + Admin
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
                element: <EmployeeProfilePage />
              },
            ]
          },

          // --- Public Authenticated Area (All Roles) ---
          { path: "my-profile", element: <MyProfilePage /> },

          // --- Leaves Management ---
          {
            path: "leaves",
            children: [
              { path: "apply", element: <LeaveApplicationForm /> },
              { path: "acting", element: <ActingRequestsPage /> },
              { 
                path: "requests", 
                element: <ProtectedRouter ProtectedRole="DEPT_HEAD"><LeaveApprovalDashboard /></ProtectedRouter> 
              },
              { path: "my-details", element: <MyLeaveDetailsPage /> }
            ]
          },

          // --- Coming Soon / Featured Modules ---
          { path: "attendance", element: <ComingSoon title="My Attendance Coming Soon" /> },
          { path: "ot-calculator", element: <ComingSoon title="OT Calculator Coming Soon" /> },
          { path: "vehicle-request", element: <ComingSoon title="Vehicle Request Coming Soon" /> },

          // --- Catch-all 404 ---
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
