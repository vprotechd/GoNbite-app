import {
  loginUser,
  registerUser,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
  googleOAuthLogin,
  facebookOAuthLogin,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();

// =====================================================
// PUBLIC AUTH ROUTES
// =====================================================

// REGISTER
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// FORGOT PASSWORD
router.post("/forgot-password", forgotPassword);

// VERIFY RESET OTP
router.post("/verify-reset-otp", verifyResetOTP);

// RESET PASSWORD
router.post("/reset-password", resetPassword);

// =====================================================
// CHANGE PASSWORD
// USER MUST ALREADY BE LOGGED IN
// =====================================================

router.post(
  "/change-password",
  authMiddleware,
  changePassword
);

// =====================================================
// GOOGLE OAUTH
// PUBLIC ROUTE
// IMPORTANT: MUST BE BEFORE router.use(authMiddleware)
// =====================================================
// =====================================================
// GOOGLE OAUTH
// PUBLIC
// =====================================================

router.post(
  "/oauth/google",
  googleOAuthLogin
);


// =====================================================
// FACEBOOK OAUTH
// PUBLIC
// =====================================================

router.post(
  "/oauth/facebook",
  facebookOAuthLogin
);

// =====================================================
// EVERYTHING BELOW THIS POINT IS PROTECTED
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET PROFILE
// =====================================================

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    return res.status(500).json({
      error: "Failed to get profile",
    });
  }
});

// =====================================================
// UPDATE PROFILE
// =====================================================

router.put("/profile", async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      latitude,
      longitude,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    // Update only provided fields
    if (name !== undefined) {
      user.name = name;
    }

    if (phone !== undefined) {
      user.phone = phone;
    }

    if (address !== undefined) {
      user.address = address;
    }

    if (latitude !== undefined) {
      user.latitude = latitude;
    }

    if (longitude !== undefined) {
      user.longitude = longitude;
    }

    await user.save();

    return res.json({
      message: "Profile updated successfully",

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        latitude: user.latitude,
        longitude: user.longitude,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

export default router;