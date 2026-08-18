import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

const router = express.Router();

/* =========================================================
   ADMIN LOGIN
   POST /api/admin/login
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find admin from Admin collection ONLY
    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Compare password with bcrypt hash
    const isMatch = await bcrypt.compare(
      password,
      admin.password,
    );

    if (!isMatch) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    // Create admin JWT
    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    console.log("✅ Admin login successful:", admin.email);

    res.status(200).json({
      message: "Admin login successful",
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);

    res.status(500).json({
      error: "Server error during admin login.",
    });
  }
});


/* =========================================================
   GET PENDING RESTAURANTS
   GET /api/admin/pending-restaurants
========================================================= */

router.get("/pending-restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      isVerified: false,
    }).sort({ createdAt: -1 });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching pending restaurants:", error);

    res.status(500).json({
      error: "Failed to fetch pending restaurants.",
    });
  }
});


/* =========================================================
   APPROVE RESTAURANT
   PUT /api/admin/approve-restaurant/:id
========================================================= */

router.put("/approve-restaurant/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        isAvailable: true,
      },
      {
        new: true,
      },
    );

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found.",
      });
    }

    res.json({
      message: "Restaurant approved successfully!",
      restaurant,
    });
  } catch (error) {
    console.error("Error approving restaurant:", error);

    res.status(500).json({
      error: "Failed to approve restaurant.",
    });
  }
});


/* =========================================================
   REJECT RESTAURANT
   PUT /api/admin/reject-restaurant/:id
========================================================= */

router.put("/reject-restaurant/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: false,
        isAvailable: false,
      },
      {
        new: true,
      },
    );

    if (!restaurant) {
      return res.status(404).json({
        error: "Restaurant not found.",
      });
    }

    res.json({
      message: "Restaurant rejected successfully.",
      restaurant,
    });
  } catch (error) {
    console.error("Error rejecting restaurant:", error);

    res.status(500).json({
      error: "Failed to reject restaurant.",
    });
  }
});


/* =========================================================
   GET ALL RESTAURANTS
   GET /api/admin/all-restaurants
========================================================= */

router.get("/all-restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({})
      .sort({ createdAt: -1 });

    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching all restaurants:", error);

    res.status(500).json({
      error: "Failed to fetch restaurants.",
    });
  }
});


/* =========================================================
   GET ALL USERS
   GET /api/admin/all-users
========================================================= */

router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);

    res.status(500).json({
      error: "Failed to fetch users.",
    });
  }
});


/* =========================================================
   TOGGLE USER ACTIVE STATUS
   PUT /api/admin/toggle-user/:id
========================================================= */

router.put("/toggle-user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: "User not found.",
      });
    }

    user.isActive = !user.isActive;

    await user.save();

    res.json({
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("Error toggling user:", error);

    res.status(500).json({
      error: "Failed to toggle user status.",
    });
  }
});


/* =========================================================
   GET ORDERS BY USER NAME
   GET /api/admin/user-orders/:userName
========================================================= */

router.get("/user-orders/:userName", async (req, res) => {
  try {
    const orders = await Order.find({
      customerName: req.params.userName,
    }).sort({
      createdAt: -1,
    });

    res.json(orders);
  } catch (error) {
    console.error("Error fetching user orders:", error);

    res.status(500).json({
      error: "Failed to fetch user orders.",
    });
  }
});


/* =========================================================
   GET ALL DELIVERY PARTNERS
   GET /api/admin/delivery-partners
========================================================= */

router.get("/delivery-partners", async (req, res) => {
  try {
    const partners = await DeliveryPartner.find({})
      .sort({ createdAt: -1 });

    res.json(partners);
  } catch (error) {
    console.error("Error fetching delivery partners:", error);

    res.status(500).json({
      error: "Failed to fetch delivery partners.",
    });
  }
});


/* =========================================================
   APPROVE DELIVERY PARTNER
   PUT /api/admin/approve-delivery-partner/:id
========================================================= */

router.put(
  "/approve-delivery-partner/:id",
  async (req, res) => {
    try {
      const partner = await DeliveryPartner.findById(
        req.params.id,
      );

      if (!partner) {
        return res.status(404).json({
          error: "Delivery partner not found.",
        });
      }

      partner.isVerified = true;

      await partner.save();

      res.json({
        message:
          "Delivery partner approved successfully!",
        partner,
      });
    } catch (error) {
      console.error(
        "Error approving delivery partner:",
        error,
      );

      res.status(500).json({
        error: "Failed to approve delivery partner.",
      });
    }
  },
);


/* =========================================================
   REJECT / REMOVE DELIVERY PARTNER
   DELETE /api/admin/reject-delivery-partner/:id
========================================================= */

router.delete(
  "/reject-delivery-partner/:id",
  async (req, res) => {
    try {
      const partner =
        await DeliveryPartner.findByIdAndDelete(
          req.params.id,
        );

      if (!partner) {
        return res.status(404).json({
          error: "Delivery partner not found.",
        });
      }

      res.json({
        message:
          "Delivery partner removed successfully.",
      });
    } catch (error) {
      console.error(
        "Error removing delivery partner:",
        error,
      );

      res.status(500).json({
        error: "Failed to remove delivery partner.",
      });
    }
  },
);


export default router;