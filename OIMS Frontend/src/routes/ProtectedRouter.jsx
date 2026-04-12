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

  // If a specific role is required, check it (ADMIN always has access)
  if (ProtectedRole && user.role !== "ADMIN" && user.role !== ProtectedRole) {
    return (
      <Error403Page />
    );
  }

  return children ? children : <Outlet />;
};

export default ProtectedRouter;
