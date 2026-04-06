import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import HomePage from "../pages/HomePage";
import Error404Page from "../pages/Error404Page";
import ProtectedRouter from "./ProtectedRouter";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      // --- Public Routes -------------------------------------------------------------------------------------------------------------------------------------
      {
        index: true,
        element: <HomePage />,
      },
      // {
      //    path: "about",
      //    element: <AboutPage />,
      // },
      // {
      //    path: "login",
      //    element: <LoginPage />,
      // },
      // {
      //    path: "register",
      //    element: <RegisterPage />,
      // },
      // {
      //    path: "forgot-password",
      //    element: <ForgotPwd />,
      // },
      // {
      //    path: "reset-password/:token",
      //    element: <ResetPassword />,
      // },
      // {
      //    path: "cart",
      //    element: <CartPage />,
      // },
      // {
      //    path: "contact",
      //    element: <ContactPage />,
      // },
      // {
      //    path: "product/:id",
      //    element: <SingleProductPage />,
      // },

      // --- Protected Routes (User must be logged in) --------------------------------------------------------------------------------------------------------------
      {
        element: <ProtectedRouter ProtectedRole="CUSTOMER" />,
        children: [
          // {
          //    path: "profile",
          //    element: <UserProfile />,
          // },
          // {
          //    path: "checkout",
          //    element: <CheckoutPage />,
          // },
          // {
          //    path: "notifications",
          //    element: <UserProfile />,
          // },
        ],
      },
      // --- Catch-all for 404 Not Found --------------------------------------------------------------------------------------------------------------------------------
      {
        path: "*",
        element: <Error404Page />,
      },
    ],
  },
  // --- Admin Protected Routes  (User must be logged in and Role Must be ADMIN) --------------------------------------------------------------------------------
  // {
  //    element: <ProtectedRouter ProtectedRole="ADMIN" />,
  //    children: [
  //       {
  //          path: "admin",
  //          element: <AdminLayout />,
  //          children: [
  //             {
  //                index: true,
  //                element: <DashboardPage />,
  //             },
  //             {
  //                path: "users",
  //                element: <UsersPage />,
  //             },
  //             {
  //                path: "products",
  //                element: <ProductsPage />,
  //             },
  //             {
  //                path: "orders",
  //                element: <OrdersPage />,
  //             },
  //             {
  //                path: "categories",
  //                element: <CategoriesPage />,
  //             },

  //          ],
  //       },
  //    ],
  // },
  // --- Routes without the MainLayout --------------------------------------------------------------------------------------------------------------------------------
  // {
  //    path: "/login",
  //    element: <LoginPage />,
  // },
  // {
  //    path: "/register",
  //    element: <RegisterPage />,
  // },
]);

const AppRouter = () => {
  return <RouterProvider router={router} />;
};

export default AppRouter;
