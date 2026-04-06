import { matchedData, validationResult } from "express-validator";
import prisma from "../config/db.mjs";
import bcrypt from "bcrypt";
import { errorCreate } from "../utils/error-creator.mjs";
import { generateTokenWithCookies } from "../utils/jwt.mjs";
import { mergeCarts } from "../utils/cartUtils.mjs";
import crypto from "crypto"; 
import { sendEmail } from "../services/emailService.mjs";
import {
   getForgotPasswordEmailHtml,
   passwordResetconformEmailHtml,
   registrationcompleteEmailHtml,
} from "../utils/emailTemplates.mjs";

// Helper to generate a secure random token for forgot password token
const generateSecureToken = () => {
   return crypto.randomBytes(32).toString("hex"); // 64 char string
};

class UserControllers {
   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    New User Registration
 * @route          POST /api/v1/users/register
 * @access         Public
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   RegisterNewUser = async (req, res) => {
      const error = validationResult(req);
      const creatingError = errorCreate(error.array());
      if (error.array().length) {
         return res.status(400).json({
            msg: "Valiation error",
            error: creatingError,
            data: null,
         });
      }

      const { firstName, lastName, username, email, password } =
         matchedData(req);

      const guestCartId = req.cookies.cartToken;

      try {
         // Hash the password
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(password, salt);

         // Create a new user in the database
         const newUser = await prisma.user.create({
            data: {
               firstName,
               lastName,
               username,
               email,
               passwordHash: hashedPassword,
            },
         });

         if (guestCartId) {
            await mergeCarts(newUser.id, guestCartId);
            res.clearCookie("cartToken"); // Clean up the guest cookie after merge
         }
         // Respond with the created user (omitting the password)
         const { passwordHash: _, ...userWithoutPassword } = newUser;

         // Send registration complete and welcome email
         await sendEmail(
            newUser.email,
            `Thank You For Register with BookNet`,
            `Welcome ${newUser.firstName} Thank You For Register with BookNet. Your Registration Complete`,
            registrationcompleteEmailHtml(newUser)
         );

         res.status(201).json({
            message: "User created successfully!",
            user: userWithoutPassword,
         });
      } catch (error) {
         console.error("Error Registering user:", error);

         if (error.code === "P2002") {
            const field = error.meta.target[0]; //  'Username' or 'Email'
            return res
               .status(409)
               .json({ error: `${field} is already taken.` });
         }

         res.status(500).json({ message: "Server error during registration" });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    User Login
 * @route          POST /api/v1/users/login
 * @access         Public
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   loginUser = async (req, res) => {
      const error = validationResult(req);
      const creatingError = errorCreate(error.array());
      if (error.array().length) {
         return res.status(400).json({
            msg: "Valiation error",
            error: creatingError,
            data: null,
         });
      }

      const { emailOrUsername, password } = matchedData(req);
      const guestCartId = req.cookies.cartToken; // Get the guest token from the cookie
      try {
         // Find user by email OR username
         const user = await prisma.user.findFirst({
            where: {
               OR: [{ email: emailOrUsername }, { username: emailOrUsername }],
            },
            include: {
               Profile: {
                  select: {
                     image: true,
                  },
               },
            },
         });

         if (!user) {
            return res
               .status(401)
               .json({ error: "User Name or Email Not Registered in Sytem" });
         }

         //  Compare passwords
         const isMatch = await bcrypt.compare(password, user.passwordHash);

         if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
         }
         if (user && isMatch) {
            // --- MERGE Cart ---
            if (guestCartId) {
               await mergeCarts(user.id, guestCartId);
               res.clearCookie("cartToken"); // Clean up the guest cookie after merge
            }

            //  Generate token and respond
            generateTokenWithCookies(res, user.id);
            const { passwordHash: _, ...userWithoutPassword } = user;

            res.status(200).json({
               message: "Login Successful",
               user: userWithoutPassword, // <-- Send the user object here
            });
         }
      } catch (error) {
         console.error(error);
         res.status(500).json({ message: "Server error during login" });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Logout user / clear cookie
 * @route          POST /api/v1/users/logout
 * @access         Public
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   logoutUser = (req, res) => {
      res.cookie("jwt", "", {
         httpOnly: true,
         expires: new Date(0),
      });
      res.status(200).json({ message: "Logged out successfully" });
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Request a password reset link
 * @route          POST /api/v1/users/forgot-password
 * @access         Public
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/

   forgotPassword = async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({
            message: "Validation error",
            error: errorCreate(errors.array()),
            data: null,
         });
      }

      const { email } = matchedData(req);

      try {
         const user = await prisma.user.findUnique({ where: { email } });

         if (!user) {
            // Return a generic success message even if user not found to prevent email enumeration
            return res.status(200).json({
               message:
                  "If an account with that email exists, a password reset link has been sent to your email.Please check Your email and click on that link.",
            });
         }

         // Generate a secure, unique token
         const resetToken = generateSecureToken();
         const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour from now

         // Save the token and its expiration to the user record
         await prisma.user.update({
            where: { id: user.id },
            data: {
               passwordResetToken: resetToken,
               passwordResetExpires: resetTokenExpiration,
            },
         });

         // Construct the reset URL for the frontend
         const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

         // Send the email
         await sendEmail(
            user.email,
            "BookNet Password Reset Request",
            `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${resetUrl}\n\nIf you did not request this, please ignore this email and your password will remain unchanged.\n\nThis link will expire in 1 hour.`,
            getForgotPasswordEmailHtml(resetUrl, user) // Use HTML template
         );

         res.status(200).json({
            message: "Password reset link has been sent to your email.Please check Your email and click on that link to change your password",
         });
      } catch (error) {
         console.error("Forgot password error:", error);
         res.status(500).json({
            message: "Server error during password reset request.",
         });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Reset user password using a valid token
 * @route          POST /api/v1/users/reset-password/:token
 * @access         Public
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/

   resetPassword = async (req, res) => {
      const { token } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
         return res.status(400).json({
            msg: "Validation error",
            error: errorCreate(errors.array()),
            data: null,
         });
      }

      const { newPassword } = matchedData(req);

      try {
         const user = await prisma.user.findFirst({
            where: {
               passwordResetToken: token,
               passwordResetExpires: {
                  gte: new Date(), // Check if token has not expired
               },
            },
         });

         if (!user) {
            return res.status(400).json({
               message: "Password reset token is invalid or has expired.Please Try again.",
            });
         }

         // Hash the new password
         const salt = await bcrypt.genSalt(10);
         const hashedPassword = await bcrypt.hash(newPassword, salt);

         // Update user's password and clear reset token fields
         await prisma.user.update({
            where: { id: user.id },
            data: {
               passwordHash: hashedPassword,
               passwordResetToken: null,
               passwordResetExpires: null,
            },
         });

         // Optionally, send a confirmation email that password was changed
         await sendEmail(
            user.email,
            "Your password has been changed",
            "This is a confirmation that the password for your account has been changed successfully.",
            passwordResetconformEmailHtml()
         );

         res.status(200).json({
            message: "Your Password has been successfully reset.Please login with new credentials",
         });
      } catch (error) {
         console.error("Reset password error:", error);
         res.status(500).json({
            message: "Server error during password reset.",
         });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Get All Users
 * @route          GET /api/v1/users/
 * @access         Admin
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   showAllUsers = async (req, res) => {
      try {
         const users = await prisma.user.findMany({
            select: {
               id: true,
               username: true,
               firstName: true,
               lastName: true,
               email: true,
               role: true,
               createdAt: true,
               updatedAt: true,

               Profile: {
                  select: {
                     image: true,
                  },
               },
            },
         });
         return res.status(200).json({
            msg: "All Users",
            data: users,
         });
      } catch (error) {
         console.error("Error :", error);

         return res.status(500).json({
            msg: "error",
            error: "Internal Server Error",
         });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    DeleteUser by ID
 * @route          DELETE /api/v1/users/:id
 * @access         Admin
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   deleteUserById = async (req, res) => {
      const { id } = req.params;

      if (!id) {
         return res.status(400).json({ message: "User ID is required." });
      }

      try {
         await prisma.user.delete({
            where: {
               id,
            },
         });

         return res.status(200).json({ message: "User deleted successfully." });
      } catch (error) {
         console.error("Error deleting user:", error);
         if (error.code === "P2025") {
            return res
               .status(404)
               .json({ message: `User with ID ${id} not found.` });
         }
         return res.status(500).json({
            msg: "error",
            error: "Internal Server Error",
         });
      }
   };

   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Get User Profile by them self
 * @route          GET /api/v1/users/my-profile
 * @access         Authenticated User
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   myProfile = async (req, res) => {
      const userId = req.authUser.id; // From 'protect' middleware

      try {
         const user = await prisma.user.findUnique({
            where: {
               id: userId,
            },
            select: {
               id: true,
               firstName: true,
               lastName: true,
               username: true,
               email: true,
               Profile: true,
            },
         });

         if (!user) {
            return res
               .status(404)
               .json({ message: `User with ID ${id} not found.` });
         }

         res.status(200).json({
            message: "User and profile retrieved successfully!",
            data: user,
         });
      } catch (error) {
         console.error("Error fetching user and profile:", error);
         res.status(500).json({ message: "An unexpected error occurred." });
      }
   };
   /**------------------------------------------------------------------------------------------------------------------------------------------------------------
 * @description    Get User Profile Details by ID
 * @route          GET /api/v1/users/:id
 * @access         Admin
 ---------------------------------------------------------------------------------------------------------------------------------------------------------------*/
   getUserAndProfileById = async (req, res) => {
      const id = req.params.id;

      try {
         const user = await prisma.user.findUnique({
            where: {
               id,
            },
            select: {
               id: true,
               username: true,
               email: true,
               Profile: true,
            },
         });

         if (!user) {
            return res
               .status(404)
               .json({ message: `User with ID ${id} not found.` });
         }

         res.status(200).json({
            message: "User and profile retrieved successfully!",
            data: user,
         });
      } catch (error) {
         console.error("Error fetching user and profile:", error);
         res.status(500).json({ message: "An unexpected error occurred." });
      }
   };
}

export default new UserControllers();
