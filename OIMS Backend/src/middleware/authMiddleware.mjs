import jwt from "jsonwebtoken";
import DB from "../config/db.mjs";

/**-------------------------------------------------------------------------------------------------------------------------------------------------
 *  Middleware to authenticate a user based on JWT token.
 * Attaches `req.authUser` if successful.
 * Blocks access if no valid token is found.
-----------------------------------------------------------------------------------------------------------------------------------------------------*/
export const authenticateToken = async (req, res, next) => {
    try {
            // Get token from header or cookie
        const authHeader = req.headers.authorization;
        const token =
            authHeader && authHeader.startsWith("Bearer ")
                ? authHeader.split(" ")[1]
                : req.cookies?.jwt;
      // If no token found
        if (!token) {
            return res.status(401).json({
                message: "Authentication Error",
                error: "Sorry Access Denied.Please Logged In (No token provided or No Cookies found)",
            });
        }
      // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the database and attach it to the request object
      // Exclude the password from the user object
        const authUser = await DB.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                username: true,
                role: true, 
            },
        });

        if (!authUser) {
            return res.status(401).json({
                message: "Authentication Error",
                error: "Not authorized, user not found.",
            });
        }

        // Attach the authenticated user to the request object
        req.authUser = authUser;
        next();
    } catch (err) {
        console.error("JWT Authentication Error:", err);
        return res.status(401).json({
            message: "Authentication Error",
            error: "Not authorized, token invalid or expired.",
        });
    }
};

/**------------------------------------------------------------------------------------------------------------------------------------------------
 *  Middleware to authorize a user based on their role(s).
 * Requires `authenticateToken` to run first.
 *  An array of roles that are allowed to access the resource.
 ------------------------------------------------------------------------------------------------------------------------------------------------*/
export const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        // req.authUser should be set by authenticateToken
        if (!req.authUser) {
            // This case should ideally not happen if authenticateToken runs first,
            return res.status(401).json({
                message: "Authorization Error",
                error: "User not authenticated.",
            });
        }

        if (!allowedRoles.includes(req.authUser.role)) {
            return res.status(403).json({
                message: "Authorization Error",
                error: `Access Denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.authUser.role}.`,
            });
        }
        next();
    };
};

/**-------------------------------------------------------------------------------------------------------------------------------------------------
 *  Middleware to attach the user if authenticated, but allows guests to proceed.
 * Does NOT block access if no token or an invalid token is found.
 * Attaches `req.authUser` if a valid token is present.
 *--------------------------------------------------------------------------------------------------------------------------------------------------
 */
export const attachUserIfAuthenticated = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token =
        authHeader && authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : req.cookies?.jwt;

    if (!token) {
        // No token, proceed as guest (req.authUser will be undefined)
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const authUser = await DB.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, email: true, username: true, role: true },
        });

        if (authUser) {
            req.authUser = authUser; // Attach user if found
        }
        next(); 
    } catch (error) {
        // Token invalid or expired, proceed as guest
        console.warn("Invalid or expired token found for optional authentication, proceeding as guest.");
        res.clearCookie('jwt');
        next();
    }
};