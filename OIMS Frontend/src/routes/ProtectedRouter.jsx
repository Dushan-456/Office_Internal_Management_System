import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { CircularProgress, Box } from "@mui/material";
import Error403Page from "../pages/Error403Page";

const ProtectedRouter = ({ ProtectedRole, children }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mandatory Password Change Redirection
  if (user.mustChangePassword && location.pathname !== "/change-password-mandatory") {
    return <Navigate to="/change-password-mandatory" replace />;
  }

  // If already on the mandatory page but NOT flagged, redirect back to root
  if (!user.mustChangePassword && location.pathname === "/change-password-mandatory") {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, check it (ADMIN always has access)
  if (ProtectedRole) {
    const roles = Array.isArray(ProtectedRole) ? ProtectedRole : [ProtectedRole];
    if (user.role !== "ADMIN" && !roles.includes(user.role)) {
      return <Error403Page />;
    }
  }

  return children ? children : <Outlet />;
};

export default ProtectedRouter;
