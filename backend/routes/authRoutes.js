import {
  loginUser,
  registerUser,

  forgotPassword,
  verifyResetOTP,
  resetPassword,
  changePassword,
} from "../controllers/authController.js";


import authMiddleware from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import express from "express";



const router = express.Router();

// =====================================================
// PUBLIC ROUTES
// =====================================================

// REGISTER
router.post("/register", registerUser);


// LOGIN
router.post("/login", loginUser);

// =====================================================
// FORGOT / RESET PASSWORD
// These MUST be public because the user is not logged in.
// =====================================================

// Forgot password
router.post("/forgot-password", forgotPassword);

router.post("/verify-reset-otp", verifyResetOTP);

// Reset password
router.post("/reset-password", resetPassword);

router.post(
  "/change-password",
  authMiddleware,
  changePassword
);

// =====================================================
// PROTECTED ROUTES
// Everything below this line requires authentication.
// =====================================================

router.use(authMiddleware);

// =====================================================
// GET USER PROFILE
// =====================================================

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Profile GET Error:", error);

    res.status(500).json({
      error: "Failed to fetch profile",
    });
  }
});

// =====================================================
// UPDATE USER PROFILE
// =====================================================

router.put("/profile", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        address,
      },
      {
        new: true,
      }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        error: "User not found",
      });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Profile PUT Error:", error);

    res.status(500).json({
      error: "Failed to update profile",
    });
  }
});

// =====================================================
// GOOGLE OAUTH
// =====================================================

router.post("/oauth/google", async (req, res) => {
  try {
    const {
      email,
      name,
      providerId,
    } = req.body;

    if (!email || !name || !providerId) {
      return res.status(400).json({
        error: "Email, name and providerId are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      user = new User({
        name,
        email: cleanEmail,

        // Temporary OAuth password
        password: providerId,

        role: "customer",
        phone: "",
        address: "",
      });

      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Google login successful",

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
    console.error("Google OAuth Error:", error);

    res.status(500).json({
      error: "Google login failed",
    });
  }
});

// =====================================================
// FACEBOOK OAUTH
// =====================================================

router.post("/oauth/facebook", async (req, res) => {
  try {
    const {
      email,
      name,
      providerId,
    } = req.body;

    if (!email || !name || !providerId) {
      return res.status(400).json({
        error: "Email, name and providerId are required",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    let user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      user = new User({
        name,
        email: cleanEmail,

        // Temporary OAuth password
        password: providerId,

        role: "customer",
        phone: "",
        address: "",
      });

      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({
      message: "Facebook login successful",

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
    console.error("Facebook OAuth Error:", error);

    res.status(500).json({
      error: "Facebook login failed",
    });
  }
});

// =====================================================

export default router;