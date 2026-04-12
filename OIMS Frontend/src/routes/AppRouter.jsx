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

const router = createBrowserRouter([
  // --- Login Route (standalone, NO sidebar/layout) ---
  {
    path: "/login",
    element: <LoginPage />,
  },

  // --- All authenticated routes wrapped in MainLayout ---
  {
    element: <ProtectedRouter />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          // --- Dashboard (Admin only, others redirect to My Profile) ---
          {
            index: true,
            element: <DashboardPage />,
          },

          // --- Employee Management ---
          {
            path: "employees",
            element: <AllEmployeesPage />,
          },
          {
            path: "employees/add",
            element: <AddEmployeePage />,
          },
          {
            path: "employees/:id",
            element: <EmployeeProfilePage />,
          },
          {
            path: "employees/edit/:id",
            element: <EditEmployeePage />,
          },

          // --- My Profile (all roles) ---
          {
            path: "my-profile",
            element: <MyProfilePage />,
          },

          // --- Catch-all 404 ---
          {
            path: "*",
            element: <Error404Page />,
          },
        ],
      },
    ],
  },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
