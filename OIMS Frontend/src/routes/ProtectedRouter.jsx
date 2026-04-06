import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Error403Page from "../pages/Error403Page";

const ProtectedRouter = ({ ProtectedRole }) => {
  // user and authentication status from the global context
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  // Check if the user is authenticated
  if (!isAuthenticated) {
    // If not, redirect them to the login page
    // Save the route user wanted
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for role-based access if a 'ProtectedRole' is required
  // An 'ADMIN' can access any protected route.
  const isAuthorized = user.role === "ADMIN" || user.role === ProtectedRole;

  if (ProtectedRole && !isAuthorized) {
    // If a role is required and the user is not an admin or doesn't have the role
    return <Error403Page />;
  }

  //  If the user is authenticated and has the correct role (or no role is required),
  // render the child component
  return <Outlet />;
};

export default ProtectedRouter;
