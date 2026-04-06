import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Error404Page from "../pages/Error404Page";
import ProtectedRouter from "./ProtectedRouter";
import AddUserPage from "../pages/admin/AddUserPage";
import LoginPage from "../pages/LoginPage";

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
          // --- Dashboard / Home (redirect based on role is handled inside) ---
          {
            index: true,
            element: <Navigate to="/admin/users" replace />,
          },

          // --- Admin Routes ---
          {
            path: "admin/users",
            element: <div>User List Page Stub</div>,
          },
          {
            path: "admin/users/add",
            element: <AddUserPage />,
          },

          // --- Employee Routes (stubs for now) ---
          {
            path: "employee/attendance",
            element: <div>My Attendance Page Stub</div>,
          },
          {
            path: "employee/leave",
            element: <div>Apply Leave Page Stub</div>,
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
