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
