import bcrypt from "bcryptjs";
import express from "express";
import jwt from "jsonwebtoken";

import Admin from "../models/Admin.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

import adminAuthMiddleware from "../middleware/adminAuthMiddleware.js";
import {
  createAdminNotification,
} from "../controllers/notificationController.js";

const router = express.Router();


/* =========================================================
   ADMIN LOGIN
   POST /api/admin/login

   IMPORTANT:
   This route MUST remain above adminAuthMiddleware.
   Login does not have a token yet.
========================================================= */

router.post("/login", async (req, res) => {
  console.log("🔥🔥🔥 ADMIN LOGIN ROUTE HIT 🔥🔥🔥");

  try {
    const { email, password } = req.body;

    console.log("========== ADMIN LOGIN DEBUG ==========");
    console.log("Email received:", email);
    console.log("Password received:", password ? "YES" : "NO");
    console.log("=======================================");

    /* -------------------------------------------------------
       VALIDATION
    ------------------------------------------------------- */

    if (!email || !password) {
      console.log("❌ Email or password missing");

      return res.status(400).json({
        error: "Email and password are required.",
      });
    }

    /* -------------------------------------------------------
       NORMALIZE EMAIL
    ------------------------------------------------------- */

    const normalizedEmail = email.trim().toLowerCase();

    console.log("Normalized email:", normalizedEmail);

    /* -------------------------------------------------------
       FIND ADMIN
       IMPORTANT: Admin collection ONLY
    ------------------------------------------------------- */

    const admin = await Admin.findOne({
      email: normalizedEmail,
    });

    if (!admin) {
      console.log(
        "❌ Admin not found:",
        normalizedEmail
      );

      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    console.log(
      "✅ Admin found:",
      admin.email
    );

    /* -------------------------------------------------------
       CHECK PASSWORD
    ------------------------------------------------------- */

    const isMatch = await bcrypt.compare(
      password,
      admin.password
    );

    if (!isMatch) {
      console.log("❌ Admin password does not match");

      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    console.log("✅ Admin password verified");

    /* -------------------------------------------------------
       CHECK JWT SECRET
    ------------------------------------------------------- */

    if (!process.env.JWT_SECRET) {
      console.error(
        "❌ JWT_SECRET is missing from environment variables"
      );

      return res.status(500).json({
        error: "Server configuration error.",
      });
    }

    /* -------------------------------------------------------
       CREATE ADMIN JWT
    ------------------------------------------------------- */

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: "admin",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    console.log(
      "✅ Admin login successful:",
      admin.email
    );

    /* -------------------------------------------------------
       SEND RESPONSE
    ------------------------------------------------------- */

    return res.status(200).json({
      message: "Admin login successful",

      token,

      admin: {
        id: admin._id,
        email: admin.email,
        role: "admin",
      },
    });

  } catch (error) {
    console.error(
      "❌ Admin login error:",
      error
    );

    return res.status(500).json({
      error: "Server error during admin login.",
    });
  }
});


/* =========================================================
   ADMIN AUTHENTICATION
   EVERYTHING BELOW THIS LINE IS PROTECTED
========================================================= */

router.use(adminAuthMiddleware);


/* =========================================================
   ADMIN AUTH TEST
   GET /api/admin/verify
========================================================= */

router.get("/verify", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin authentication is valid.",
    admin: req.admin,
  });
});


/* =========================================================
   ADMIN DASHBOARD STATISTICS
   GET /api/admin/dashboard
========================================================= */

router.get("/dashboard", async (req, res) => {
  try {
    const [
      totalUsers,
      totalRestaurants,
      totalDeliveryPartners,
      totalOrders,
      pendingRestaurants,
      pendingDeliveryPartners,
      deliveredOrders,
      cancelledOrders,
    ] = await Promise.all([
      User.countDocuments(),

      Restaurant.countDocuments(),

      DeliveryPartner.countDocuments(),

      Order.countDocuments(),

      Restaurant.countDocuments({
        isVerified: false,
      }),

      DeliveryPartner.countDocuments({
        verificationStatus: "Pending",
      }),

      Order.countDocuments({
        status: "Delivered",
      }),

      Order.countDocuments({
        status: "Cancelled",
      }),
    ]);

    /* -------------------------------------------------------
       CALCULATE REVENUE
    ------------------------------------------------------- */

    const revenueResult = await Order.aggregate([
      {
        $match: {
          status: "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: {
              $ifNull: ["$totalAmount", 0],
            },
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0
        ? revenueResult[0].totalRevenue
        : 0;

    return res.json({
      success: true,

      stats: {
        totalUsers,
        totalRestaurants,
        totalDeliveryPartners,
        totalOrders,

        pendingRestaurants,
        pendingDeliveryPartners,

        deliveredOrders,
        cancelledOrders,

        totalRevenue,
      },
    });

  } catch (error) {
    console.error(
      "❌ ADMIN DASHBOARD ERROR:",
      error
    );

    return res.status(500).json({
      error: "Failed to fetch dashboard statistics.",
    });
  }
});


/* =========================================================
   GET PENDING RESTAURANTS
   GET /api/admin/pending-restaurants
========================================================= */

router.get(
  "/pending-restaurants",
  async (req, res) => {
    try {
      const restaurants =
        await Restaurant.find({
          isVerified: false,
        }).sort({
          createdAt: -1,
        });

      return res.json(restaurants);

    } catch (error) {
      console.error(
        "Error fetching pending restaurants:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch pending restaurants.",
      });
    }
  }
);


/* =========================================================
   APPROVE RESTAURANT
   PUT /api/admin/approve-restaurant/:id
========================================================= */

router.put(
  "/approve-restaurant/:id",
  async (req, res) => {
    try {
      const restaurant =
        await Restaurant.findByIdAndUpdate(
          req.params.id,
          {
            isVerified: true,
            isAvailable: true,
          },
          {
            new: true,
          }
        );

      if (!restaurant) {
        return res.status(404).json({
          error: "Restaurant not found.",
        });
      }

      return res.json({
        success: true,
        message: "Restaurant approved successfully!",
        restaurant,
      });

    } catch (error) {
      console.error(
        "Error approving restaurant:",
        error
      );

      return res.status(500).json({
        error: "Failed to approve restaurant.",
      });
    }
  }
);


/* =========================================================
   REJECT RESTAURANT
   PUT /api/admin/reject-restaurant/:id
========================================================= */

router.put(
  "/reject-restaurant/:id",
  async (req, res) => {
    try {
      const restaurant =
        await Restaurant.findByIdAndUpdate(
          req.params.id,
          {
            isVerified: false,
            isAvailable: false,
          },
          {
            new: true,
          }
        );

      if (!restaurant) {
        return res.status(404).json({
          error: "Restaurant not found.",
        });
      }

      return res.json({
        success: true,
        message: "Restaurant rejected successfully.",
        restaurant,
      });

    } catch (error) {
      console.error(
        "Error rejecting restaurant:",
        error
      );

      return res.status(500).json({
        error: "Failed to reject restaurant.",
      });
    }
  }
);


/* =========================================================
   GET ALL RESTAURANTS
   GET /api/admin/all-restaurants
========================================================= */

router.get(
  "/all-restaurants",
  async (req, res) => {
    try {
      const restaurants =
        await Restaurant.find({})
          .sort({
            createdAt: -1,
          });

      return res.json(restaurants);

    } catch (error) {
      console.error(
        "Error fetching all restaurants:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch restaurants.",
      });
    }
  }
);


/* =========================================================
   GET SINGLE RESTAURANT
   GET /api/admin/restaurant/:id
========================================================= */

router.get(
  "/restaurant/:id",
  async (req, res) => {
    try {
      const restaurant =
        await Restaurant.findById(
          req.params.id
        );

      if (!restaurant) {
        return res.status(404).json({
          error: "Restaurant not found.",
        });
      }

      return res.json(restaurant);

    } catch (error) {
      console.error(
        "Error fetching restaurant:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch restaurant.",
      });
    }
  }
);


/* =========================================================
   TOGGLE RESTAURANT ACTIVE / AVAILABLE STATUS
   PUT /api/admin/toggle-restaurant/:id
========================================================= */

router.put(
  "/toggle-restaurant/:id",
  async (req, res) => {
    try {
      const restaurant =
        await Restaurant.findById(
          req.params.id
        );

      if (!restaurant) {
        return res.status(404).json({
          error: "Restaurant not found.",
        });
      }

      restaurant.isAvailable =
        !restaurant.isAvailable;

      await restaurant.save();

      return res.json({
        success: true,

        message: `Restaurant ${
          restaurant.isAvailable
            ? "activated"
            : "deactivated"
        } successfully.`,

        isAvailable:
          restaurant.isAvailable,
      });

    } catch (error) {
      console.error(
        "Error toggling restaurant:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to toggle restaurant status.",
      });
    }
  }
);


/* =========================================================
   GET ALL USERS
   GET /api/admin/all-users
========================================================= */

router.get(
  "/all-users",
  async (req, res) => {
    try {
      const users =
        await User.find({})
          .select("-password")
          .sort({
            createdAt: -1,
          });

      return res.json(users);

    } catch (error) {
      console.error(
        "Error fetching users:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch users.",
      });
    }
  }
);


/* =========================================================
   GET SINGLE USER
   GET /api/admin/user/:id
========================================================= */

router.get(
  "/user/:id",
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        ).select("-password");

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      return res.json(user);

    } catch (error) {
      console.error(
        "Error fetching user:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch user.",
      });
    }
  }
);


/* =========================================================
   TOGGLE USER ACTIVE STATUS
   PUT /api/admin/toggle-user/:id
========================================================= */

router.put(
  "/toggle-user/:id",
  async (req, res) => {
    try {
      const user =
        await User.findById(
          req.params.id
        );

      if (!user) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      user.isActive =
        !user.isActive;

      await user.save();

      return res.json({
        success: true,

        message: `User ${
          user.isActive
            ? "activated"
            : "deactivated"
        } successfully.`,

        isActive:
          user.isActive,
      });

    } catch (error) {
      console.error(
        "Error toggling user:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to toggle user status.",
      });
    }
  }
);


/* =========================================================
   GET ORDERS BY USER NAME
   GET /api/admin/user-orders/:userName
========================================================= */

router.get(
  "/user-orders/:userName",
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          customerName:
            req.params.userName,
        }).sort({
          createdAt: -1,
        });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching user orders:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch user orders.",
      });
    }
  }
);


/* =========================================================
   GET ALL DELIVERY PARTNERS
   GET /api/admin/delivery-partners

   Password is NEVER returned.
========================================================= */

router.get(
  "/delivery-partners",
  async (req, res) => {
    try {
      const partners =
        await DeliveryPartner.find({})
          .select("-password")
          .sort({
            createdAt: -1,
          });

      return res.json(partners);

    } catch (error) {
      console.error(
        "Error fetching delivery partners:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch delivery partners.",
      });
    }
  }
);


/* =========================================================
   GET PENDING DELIVERY PARTNERS
   GET /api/admin/pending-delivery-partners
========================================================= */

router.get(
  "/pending-delivery-partners",
  async (req, res) => {
    try {
      const partners =
        await DeliveryPartner.find({
          verificationStatus: "Pending",
        })
          .select("-password")
          .sort({
            createdAt: -1,
          });

      return res.json(partners);

    } catch (error) {
      console.error(
        "Error fetching pending delivery partners:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch pending delivery partners.",
      });
    }
  }
);


/* =========================================================
   GET SINGLE DELIVERY PARTNER
   GET /api/admin/delivery-partner/:id

   Includes verification documents.
   Password is excluded.
========================================================= */

router.get(
  "/delivery-partner/:id",
  async (req, res) => {
    try {
      const partner =
        await DeliveryPartner.findById(
          req.params.id
        ).select("-password");

      if (!partner) {
        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });
      }

      return res.json(partner);

    } catch (error) {
      console.error(
        "Error fetching delivery partner:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch delivery partner.",
      });
    }
  }
);


/* =========================================================
   APPROVE DELIVERY PARTNER
   PUT /api/admin/approve-delivery-partner/:id

   IMPORTANT:
   Admin approval updates BOTH:
   isVerified
   verificationStatus
========================================================= */

router.put(
  "/approve-delivery-partner/:id",
  async (req, res) => {
    try {
      const partner =
        await DeliveryPartner.findById(
          req.params.id
        );

      if (!partner) {
        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });
      }

      partner.isVerified = true;

      partner.verificationStatus =
        "Approved";

      partner.verificationRejectionReason =
        null;

      // Partner starts offline after approval.
      partner.isOnline = false;

      await partner.save();

      return res.json({
        success: true,

        message:
          "Delivery partner approved successfully!",

        partner,
      });

    } catch (error) {
      console.error(
        "Error approving delivery partner:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to approve delivery partner.",
      });
    }
  }
);


/* =========================================================
   REJECT DELIVERY PARTNER
   PUT /api/admin/reject-delivery-partner/:id

   Body:
   {
      "reason": "Driving licence is not clear."
   }

   IMPORTANT:
   We DO NOT delete the account.
   We mark it as Rejected.
========================================================= */

router.put(
  "/reject-delivery-partner/:id",
  async (req, res) => {
    try {
      const { reason } = req.body;

      const partner =
        await DeliveryPartner.findById(
          req.params.id
        );

      if (!partner) {
        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });
      }

      partner.isVerified = false;

      partner.verificationStatus =
        "Rejected";

      partner.verificationRejectionReason =
        reason ||
        "Documents could not be verified.";

      // Rejected partners cannot be online.
      partner.isOnline = false;

      await partner.save();

      return res.json({
        success: true,

        message:
          "Delivery partner rejected successfully.",

        partner,
      });

    } catch (error) {
      console.error(
        "Error rejecting delivery partner:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to reject delivery partner.",
      });
    }
  }
);


/* =========================================================
   GET ALL ORDERS
   GET /api/admin/orders

   Admin can monitor the complete order flow.
========================================================= */

router.get(
  "/orders",
  async (req, res) => {
    try {
      const orders =
        await Order.find({})
          .populate(
            "restaurantId",
            "restaurantName name"
          )
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching admin orders:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch orders.",
      });
    }
  }
);


/* =========================================================
   GET SINGLE ORDER
   GET /api/admin/orders/:id
========================================================= */

router.get(
  "/orders/:id",
  async (req, res) => {
    try {
      const order =
        await Order.findById(
          req.params.id
        )
          .populate(
            "restaurantId",
            "restaurantName name address"
          )
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          );

      if (!order) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      return res.json(order);

    } catch (error) {
      console.error(
        "Error fetching order:",
        error
      );

      return res.status(500).json({
        error: "Failed to fetch order.",
      });
    }
  }
);


/* =========================================================
   GET ORDERS BY STATUS
   GET /api/admin/orders/status/:status

   Example:
   /api/admin/orders/status/Preparing
   /api/admin/orders/status/Delivered
========================================================= */

router.get(
  "/orders/status/:status",
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          status: req.params.status,
        })
          .populate(
            "restaurantId",
            "restaurantName name"
          )
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching orders by status:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch orders by status.",
      });
    }
  }
);


/* =========================================================
   GET ACTIVE ORDERS
   GET /api/admin/active-orders

   Orders that are currently moving through
   the delivery process.
========================================================= */

router.get(
  "/active-orders",
  async (req, res) => {
    try {
      const activeStatuses = [
        "Pending",
        "Accepted",
        "Preparing",
        "Ready for Pickup",
        "Accepted by Delivery",
        "Out for Delivery",
      ];

      const orders =
        await Order.find({
          status: {
            $in: activeStatuses,
          },
        })
          .populate(
            "restaurantId",
            "restaurantName name address"
          )
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType currentLocation"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching active orders:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch active orders.",
      });
    }
  }
);


/* =========================================================
   GET DELIVERY PARTNER ORDERS
   GET /api/admin/delivery-partner-orders/:id
========================================================= */

router.get(
  "/delivery-partner-orders/:id",
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          deliveryPartnerId:
            req.params.id,
        })
          .populate(
            "restaurantId",
            "restaurantName name address"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching delivery partner orders:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch delivery partner orders.",
      });
    }
  }
);


/* =========================================================
   GET RESTAURANT ORDERS
   GET /api/admin/restaurant-orders/:id
========================================================= */

router.get(
  "/restaurant-orders/:id",
  async (req, res) => {
    try {
      const orders =
        await Order.find({
          restaurantId:
            req.params.id,
        })
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          )
          .sort({
            createdAt: -1,
          });

      return res.json(orders);

    } catch (error) {
      console.error(
        "Error fetching restaurant orders:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch restaurant orders.",
      });
    }
  }
);


/* =========================================================
   ADMIN ORDER STATUS SUMMARY
   GET /api/admin/order-status-summary
========================================================= */

router.get(
  "/order-status-summary",
  async (req, res) => {
    try {
      const summary =
        await Order.aggregate([
          {
            $group: {
              _id: "$status",
              count: {
                $sum: 1,
              },
            },
          },
          {
            $sort: {
              count: -1,
            },
          },
        ]);

      return res.json({
        success: true,
        summary,
      });

    } catch (error) {
      console.error(
        "Error fetching order status summary:",
        error
      );

      return res.status(500).json({
        error:
          "Failed to fetch order status summary.",
      });
    }
  }
);

/* =========================================================
   ADMIN CREATE NOTIFICATION
   POST /api/admin/notifications

   target: "all"  → all users
   target: "user" → specific user
========================================================= */

router.post(
  "/notifications",
  adminAuthMiddleware,
  createAdminNotification
);


/* =========================================================
   EXPORT ROUTER
========================================================= */

export default router;