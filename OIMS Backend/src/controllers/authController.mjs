import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from "../models/User.mjs";
import EmailService from "../services/emailService.mjs";
import { getResetPasswordTemplate } from "../templates/emailTemplates.mjs";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '90d',
  });
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Incorrect email or password' });
    }

    const token = signToken(user._id);

    // Send token as Bearer and also in body
    res.status(200).json({
      success: true,
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          profilePicture: user.profilePicture,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    // 1) Get user from collection
    const user = await User.findById(userId).select('+password');

    // 2) Check if currentPassword is correct
    if (!(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    // 3) Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────────
export const forgotPassword = async (req, res, next) => {
  try {
    let user;
    
    // Determine target user: by ID (Admin trigger) or by Email (Self-service recovery)
    if (req.params.id) {
      // Security: Only Admins can trigger reset via ID
      if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Administrative privileges required for manual reset triggers.' });
      }
      user = await User.findById(req.params.id);
    } else {
      const { email } = req.body;
      if (!email) return res.status(400).json({ success: false, message: 'Please provide an email address.' });
      user = await User.findOne({ email });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Institutional record not found.' });
    }

    // 2) Generate the random reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    const htmlTemplate = getResetPasswordTemplate(resetUrl, user.firstName);

    try {
      await EmailService.sendPasswordReset(user, resetUrl, htmlTemplate);

      res.status(200).json({
        success: true,
        message: 'Security link dispatched to your institutional email address.'
      });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'System failed to dispatch the security link. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────────
export const resetPassword = async (req, res, next) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      return res.status(400).json({ success: false, message: 'Security token is invalid or has expired.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // 3) Log the user in, send JWT
    const token = signToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Access restored.',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          department: user.department,
          profilePicture: user.profilePicture,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
