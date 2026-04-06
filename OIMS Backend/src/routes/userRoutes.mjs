import { Router } from "express";
import {authenticateToken,authorizeRole} from "../middleware/authMiddleware.mjs";
import profileControllers from "../controllers/profileControllers.mjs";
import { forgotEmailValidator, loginValidator, ProfileFieldsValidator, RegisterValidator, resetPasswordValidate } from "../middleware/validationMethods.mjs";
import userControllers from "../controllers/userControllers.mjs";
import { Role } from '../generated/prisma/index.js'; 


const userRoutes = Router();

// --- PUBLIC ROUTES -------------------------------------------------------------------------------------------------------

userRoutes.post("/register",RegisterValidator(), userControllers.RegisterNewUser);
userRoutes.post("/login", loginValidator(), userControllers.loginUser);
userRoutes.post("/logout", userControllers.logoutUser);
userRoutes.post("/forgot-password",forgotEmailValidator(), userControllers.forgotPassword);
userRoutes.post("/reset-password/:token",resetPasswordValidate(), userControllers.resetPassword);

// --- PROTECTED ROUTES (Require Authentication) -------------------------------------------------------------------------

userRoutes.post("/:id",ProfileFieldsValidator(), authenticateToken, profileControllers.createOrUpdateUserProfile);
userRoutes.get("/my-profile", authenticateToken, userControllers.myProfile);

// --- ADMIN-ONLY ROUTES (Require Authentication & Authorization) ----------------------------------------------------------

userRoutes.get( "/", authenticateToken, authorizeRole([Role.ADMIN]),  userControllers.showAllUsers);
userRoutes.delete("/:id", authenticateToken, authorizeRole([Role.ADMIN]),  userControllers.deleteUserById);
userRoutes.get("/:id",authenticateToken, authorizeRole([Role.ADMIN]), userControllers.getUserAndProfileById);

export default userRoutes;
