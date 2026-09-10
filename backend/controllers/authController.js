import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "10d",
    }
  );
};

// =====================================================
// REGISTER
// =====================================================

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      address,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      phone: phone || "",
      address: address || "",
      isVerified: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// LOGIN
// =====================================================

export const loginUser = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// =====================================================
// FORGOT PASSWORD - SEND OTP
// =====================================================

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email address is required",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(404).json({
        message:
          "No account found with this email address",
      });
    }

    // =================================================
    // GENERATE 6-DIGIT OTP
    // =================================================

    const otp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // =================================================
    // SAVE OTP
    // OTP VALID FOR 5 MINUTES
    // =================================================

    user.resetPasswordOTP = otp;

    user.resetPasswordOTPExpires = new Date(
      Date.now() + 5 * 60 * 1000
    );

    // Remove old reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    console.log("========== OTP SAVED ==========");
    console.log("EMAIL:", user.email);
    console.log("OTP:", user.resetPasswordOTP);
    console.log(
      "OTP EXPIRES:",
      user.resetPasswordOTPExpires
    );
    console.log("CURRENT TIME:", new Date());
    console.log("================================");

    // =================================================
    // SEND OTP EMAIL
    // =================================================

    const { data, error } =
      await resend.emails.send({
        from: "Snax <onboarding@resend.dev>",
        to: [cleanEmail],
        subject: "Snax Password Reset OTP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">

            <h2 style="color: #081A33;">
              Snax Password Reset
            </h2>

            <p>
              Your password reset OTP is:
            </p>

            <div style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              margin: 20px 0;
              color: #F5B82E;
            ">
              ${otp}
            </div>

            <p>
              This OTP is valid for <strong>5 minutes</strong>.
            </p>

            <p>
              If you did not request a password reset,
              you can safely ignore this email.
            </p>

            <p>
              Regards,<br />
              <strong>Snax Team</strong>
            </p>

          </div>
        `,
      });

    if (error) {
      console.error(
        "RESEND EMAIL ERROR:",
        error
      );

      return res.status(500).json({
        message: "Failed to send OTP email",
      });
    }

    console.log(
      "OTP email sent successfully:",
      data
    );

    // =================================================
    // RESPONSE
    // =================================================

    res.json({
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error(
      "FORGOT PASSWORD ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to send password reset OTP",
    });
  }
};

// =====================================================
// VERIFY RESET OTP
// =====================================================

export const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

    const cleanEmail = email
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
      resetPasswordOTP: otp,
      resetPasswordOTPExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
      });
    }

    // =================================================
    // GENERATE RESET TOKEN
    // =================================================

    const resetToken = crypto
      .randomBytes(32)
      .toString("hex");

    user.resetPasswordToken = resetToken;

    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    // Clear OTP after verification
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;

    await user.save();

    res.json({
      message: "OTP verified successfully",
      resetToken,
    });

  } catch (error) {
    console.error(
      "VERIFY RESET OTP ERROR:",
      error
    );

    res.status(500).json({
      message: "Failed to verify OTP",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================

export const resetPassword = async (req, res) => {
  try {
    const {
      token,
      password,
      confirmPassword,
    } = req.body;

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password || !confirmPassword) {
      return res.status(400).json({
        message:
          "Password and confirm password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Reset token is invalid or expired",
      });
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Delete reset token
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      message: "Password reset successfully",
    });

  } catch (error) {
    console.error(
      "RESET PASSWORD ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to reset password",
    });
  }
};

// =====================================================
// CHANGE PASSWORD
// =====================================================

export const changePassword = async (req, res) => {
  try {
    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    // Validate input
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      return res.status(400).json({
        message:
          "Current password, new password and confirm password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
    }

    // Confirm new password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message:
          "New passwords do not match",
      });
    }

    // Find logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Check current password
    const passwordMatch =
      await bcrypt.compare(
        currentPassword,
        user.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        message:
          "Current password is incorrect",
      });
    }

    // Prevent using same password
    const samePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (samePassword) {
      return res.status(400).json({
        message:
          "New password must be different from current password",
      });
    }

    // Hash new password
    const hashedPassword =
      await bcrypt.hash(
        newPassword,
        10
      );

    // Save new password
    user.password = hashedPassword;

    await user.save();

    res.json({
      message:
        "Password changed successfully",
    });

  } catch (error) {
    console.error(
      "CHANGE PASSWORD ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to change password",
    });
  }
};
