import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "../store/useAuthStore";
import { CircularProgress, Box } from "@mui/material";

const ProtectedRouter = ({ ProtectedRole }) => {
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

  // If a specific role is required, check it (ADMIN always has access)
  if (ProtectedRole && user.role !== "ADMIN" && user.role !== ProtectedRole) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ fontSize: '4rem' }}>🚫</Box>
        <Box sx={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#334155' }}>Access Denied</Box>
        <Box sx={{ color: '#64748b' }}>You don't have permission to access this page.</Box>
      </Box>
    );
  }

  return <Outlet />;
};

export default ProtectedRouter;
