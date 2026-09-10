import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import DeliveryPartner from "../models/DeliveryPartner.js";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// ======================================================
// FILE UPLOAD CONFIGURATION
// ======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadPath = path.join(
  __dirname,
  "../uploads/delivery-documents"
);


// Create folder if it doesn't exist
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, {
    recursive: true,
  });

  console.log(
    "✅ Created delivery-documents folder:",
    uploadPath
  );
} else {
  console.log(
    "✅ Delivery documents folder exists:",
    uploadPath
  );
}


// ======================================================
// MULTER STORAGE
// ======================================================

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {

    const extension = path.extname(
      file.originalname
    );

    const uniqueName =
      `${Date.now()}-${Math.round(Math.random() * 1E9)}${extension}`;

    cb(null, uniqueName);
  },

});


// ======================================================
// FILE FILTER
// ======================================================

const fileFilter = (req, file, cb) => {

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {

    cb(null, true);

  } else {

    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );

  }

};


// ======================================================
// MULTER
// ======================================================

const upload = multer({

  storage,

  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

});


// ======================================================
// REGISTER DELIVERY PARTNER
// ======================================================

router.post(
  "/register",

  upload.fields([
    {
      name: "aadhaarDocument",
      maxCount: 1,
    },
    {
      name: "drivingLicenseDocument",
      maxCount: 1,
    },
    {
      name: "livePhoto",
      maxCount: 1,
    },
  ]),

  async (req, res) => {

    try {

      console.log("=================================");
      console.log("DELIVERY PARTNER REGISTRATION");
      console.log("BODY:", req.body);
      console.log("FILES:", req.files);
      console.log("=================================");


      const {
        name,
        email,
        password,
        phone,
        vehicleType,
      } = req.body;


      // ==================================================
      // BASIC VALIDATION
      // ==================================================

      if (
        !name ||
        !email ||
        !password ||
        !phone ||
        !vehicleType
      ) {

        return res.status(400).json({
          error:
            "Please fill in all required fields.",
        });

      }


      // ==================================================
      // VEHICLE VALIDATION
      // ==================================================

      const allowedVehicles = [
        "Bike",
        "Scooter",
        "Bicycle",
      ];

      if (
        !allowedVehicles.includes(vehicleType)
      ) {

        return res.status(400).json({
          error:
            "Invalid vehicle type.",
        });

      }


      // ==================================================
      // GET UPLOADED FILES
      // ==================================================

      const files = req.files || {};

      const aadhaarFile =
        files.aadhaarDocument?.[0];

      const drivingLicenseFile =
        files.drivingLicenseDocument?.[0];

      const livePhotoFile =
        files.livePhoto?.[0];


      // ==================================================
      // AADHAAR
      // ==================================================

      if (!aadhaarFile) {

        return res.status(400).json({
          error:
            "Aadhaar document is required.",
        });

      }


      // ==================================================
      // BIKE / SCOOTER
      // ==================================================

      if (
        vehicleType === "Bike" ||
        vehicleType === "Scooter"
      ) {

        if (!drivingLicenseFile) {

          return res.status(400).json({
            error:
              "Driving Licence is required for Bike and Scooter.",
          });

        }

      }


      // ==================================================
      // BICYCLE
      // ==================================================

      if (vehicleType === "Bicycle") {

        if (!livePhotoFile) {

          return res.status(400).json({
            error:
              "Live photo is required for Bicycle delivery partners.",
          });

        }

      }


      // ==================================================
      // CHECK EXISTING PARTNER
      // ==================================================

      const normalizedEmail =
        email.trim().toLowerCase();

      const existingPartner =
        await DeliveryPartner.findOne({
          email: normalizedEmail,
        });


      if (existingPartner) {

        return res.status(409).json({
          error:
            "A delivery partner with this email already exists.",
        });

      }


      // ==================================================
      // HASH PASSWORD
      // ==================================================

      const hashedPassword =
        await bcrypt.hash(
          password,
          10
        );


      // ==================================================
      // FILE PATHS
      // ==================================================

      const aadhaarDocument =
        `/uploads/delivery-documents/${aadhaarFile.filename}`;

      const drivingLicenseDocument =
        drivingLicenseFile
          ? `/uploads/delivery-documents/${drivingLicenseFile.filename}`
          : null;

      const livePhoto =
        livePhotoFile
          ? `/uploads/delivery-documents/${livePhotoFile.filename}`
          : null;


      // ==================================================
      // CREATE DELIVERY PARTNER
      // ==================================================

      const partner =
        new DeliveryPartner({

          name:
            name.trim(),

          email:
            normalizedEmail,

          password:
            hashedPassword,

          phone:
            phone.trim(),

          vehicleType,

          aadhaarDocument,

          drivingLicenseDocument,

          livePhoto,

          isVerified: false,

          verificationStatus:
            "Pending",

          verificationRejectionReason:
            null,

          isOnline: false,

        });


      await partner.save();


      console.log(
        "✅ DELIVERY PARTNER CREATED:",
        partner._id
      );


      // ==================================================
      // RESPONSE
      // ==================================================

      return res.status(201).json({

        success: true,

        message:
          "Registration submitted successfully. Please wait for Admin verification.",

        verificationStatus:
          partner.verificationStatus,

      });


    } catch (error) {

      console.error(
        "❌ DELIVERY REGISTER ERROR:",
        error
      );


      return res.status(500).json({
        error:
          error.message ||
          "Registration failed.",
      });

    }

  }
);


// ======================================================
// LOGIN DELIVERY PARTNER
// ======================================================

router.post(
  "/login",
  async (req, res) => {

    try {

      const {
        email,
        password,
      } = req.body;


      const partner =
        await DeliveryPartner.findOne({
          email:
            email?.trim().toLowerCase(),
        });


      if (!partner) {

        return res.status(401).json({
          error:
            "Invalid credentials",
        });

      }


      const isMatch =
        await bcrypt.compare(
          password,
          partner.password
        );


      if (!isMatch) {

        return res.status(401).json({
          error:
            "Invalid credentials",
        });

      }


      // ==================================================
      // ADMIN VERIFICATION CHECK
      // ==================================================

      if (!partner.isVerified) {

        return res.status(403).json({

          error:
            "Your account is pending admin verification.",

          verificationStatus:
            partner.verificationStatus,

        });

      }


      // ==================================================
      // CREATE JWT
      // ==================================================

      const token =
        jwt.sign(
          {
            id: partner._id,
            role: "delivery",
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "7d",
          }
        );


      return res.json({

        token,

        partner,

      });


    } catch (error) {

      console.error(
        "DELIVERY LOGIN ERROR:",
        error
      );


      return res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// PROFILE
// ======================================================

router.get(
  "/profile",
  authMiddleware,
  async (req, res) => {

    try {

      const partner =
        await DeliveryPartner.findById(
          req.user.id
        ).select(
          "-password -aadhaarDocument -drivingLicenseDocument -livePhoto"
        );


      if (!partner) {

        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });

      }


      res.json(partner);


    } catch (error) {

      console.error(
        "PROFILE ERROR:",
        error
      );


      res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// ONLINE / OFFLINE
// ======================================================

router.put(
  "/toggle-online",

  authMiddleware,

  async (req, res) => {

    try {

      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );


      if (!partner) {

        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });

      }


      // ==================================================
      // ADMIN VERIFICATION REQUIRED
      // ==================================================

      if (!partner.isVerified) {

        return res.status(403).json({

          error:
            "Your account is not verified by Admin yet.",

          verificationStatus:
            partner.verificationStatus,

        });

      }


      // ==================================================
      // ACTIVE ORDER CHECK
      // ==================================================

      if (
        partner.currentOrderId &&
        partner.isOnline
      ) {

        return res.status(400).json({
          error:
            "You cannot go offline while you have an active delivery.",
        });

      }


      // ==================================================
      // TOGGLE ONLINE / OFFLINE
      // ==================================================

      const newStatus =
        !partner.isOnline;

      await DeliveryPartner.findByIdAndUpdate(
        req.user.id,
        {
          isOnline: newStatus,
        },
        {
          new: true,
          runValidators: false,
        }
      );

      return res.json({
        success: true,
        isOnline: newStatus,
      });


    } catch (error) {

      console.error(
        "TOGGLE ONLINE ERROR:",
        error
      );


      return res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// AVAILABLE ORDERS
// ======================================================

router.get(
  "/available-orders",
  authMiddleware,
  async (req, res) => {
    try {

      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );

      if (!partner) {
        return res.status(404).json({
          error: "Delivery partner not found.",
        });
      }

      if (!partner.isVerified) {
        return res.status(403).json({
          error: "Your account is not verified.",
        });
      }

      // Offline partners don't receive orders
      if (!partner.isOnline) {
        return res.json([]);
      }

      // Partner already handling an order
      if (partner.currentOrderId) {
        return res.json([]);
      }

      const orders =
        await Order.find({
          status: "Preparing",
          deliveryPartnerId: null,
        })
        .populate(
          "restaurantId",
          "restaurantName address"
        )
        .sort({ createdAt: -1 });

      return res.json(orders);

    } catch (error) {

      console.error(
        "AVAILABLE ORDERS ERROR:",
        error
      );

      return res.status(500).json({
        error: error.message,
      });

    }
  }
);


// ======================================================
// ACCEPT ORDER
// ======================================================

router.put(
  "/accept-order/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }


      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );

      if (!partner) {
        return res.status(404).json({
          error: "Delivery partner not found.",
        });
      }


      if (!partner.isVerified) {
        return res.status(403).json({
          error: "Your account is not verified.",
        });
      }


      if (!partner.isOnline) {
        return res.status(400).json({
          error:
            "You must be online to accept an order.",
        });
      }


      console.log("=================================");
      console.log("ACCEPT ORDER DEBUG");
      console.log("Order ID:", order._id);
      console.log("Order Status:", order.status);
      console.log(
        "Delivery Partner ID:",
        order.deliveryPartnerId
      );
      console.log("=================================");


      // Order must be Preparing
      if (order.status !== "Preparing") {
        return res.status(400).json({
          error:
            "This order is not available for pickup.",
        });
      }


      // Someone else already accepted it
      if (order.deliveryPartnerId) {
        return res.status(400).json({
          error:
            "This order has already been assigned to another delivery partner.",
        });
      }


      // Partner already has an active order
      if (partner.currentOrderId) {
        return res.status(400).json({
          error:
            "You already have an active delivery.",
        });
      }


      // Assign partner
      order.deliveryPartnerId =
        partner._id;

      // IMPORTANT:
      // Do NOT set Out for Delivery here.
      order.status =
        "Accepted by Delivery";

      await order.save();


      // Save active order without
      // triggering document validation
      await DeliveryPartner.findByIdAndUpdate(
        partner._id,
        {
          currentOrderId:
            order._id,
        },
        {
          new: true,
          runValidators: false,
        }
      );


      console.log(
        "ORDER ACCEPTED BY DELIVERY:",
        order._id,
        "PARTNER:",
        partner._id
      );


      return res.json({
        success: true,
        message:
          "Order accepted successfully. Go to the restaurant for pickup.",
        order,
      });


    } catch (error) {

      console.error(
        "ACCEPT ORDER ERROR:",
        error
      );

      return res.status(500).json({
        error: error.message,
      });

    }

  }
);


// ======================================================
// REJECT ORDER
// ======================================================

router.put(
  "/reject-order/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const order =
        await Order.findById(
          req.params.id
        );

      if (!order) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }


      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );

      if (!partner) {
        return res.status(404).json({
          error: "Delivery partner not found.",
        });
      }


      if (!partner.isVerified) {
        return res.status(403).json({
          error: "Your account is not verified.",
        });
      }


      if (order.status !== "Preparing") {
        return res.status(400).json({
          error:
            "This order is no longer available.",
        });
      }


      if (order.deliveryPartnerId) {
        return res.status(400).json({
          error:
            "This order has already been assigned.",
        });
      }


      return res.json({
        success: true,
        message:
          "Order rejected. It remains available for other delivery partners.",
      });


    } catch (error) {

      console.error(
        "REJECT ORDER ERROR:",
        error
      );

      return res.status(500).json({
        error: error.message,
      });

    }

  }
);


// ======================================================
// UPDATE DELIVERY STATUS
// ======================================================
//
// Preparing
//     ↓
// Accepted by Delivery
//     ↓
// Restaurant marks Out for Delivery
//     ↓
// Delivery Partner marks Delivered
//
// IMPORTANT:
// Delivery partner can ONLY mark Delivered.
// Restaurant marks Out for Delivery.
// ======================================================

router.put(
  "/update-status/:id",
  authMiddleware,
  async (req, res) => {

    try {

      const { status } =
        req.body;


      console.log("=================================");
      console.log("DELIVERY STATUS UPDATE");
      console.log("Order ID:", req.params.id);
      console.log("Requested Status:", status);
      console.log("User ID:", req.user.id);
      console.log("=================================");


      // ==========================================
      // FIND ORDER
      // ==========================================

      const order =
        await Order.findById(
          req.params.id
        );


      if (!order) {
        return res.status(404).json({
          error:
            "Order not found.",
        });
      }


      // ==========================================
      // FIND DELIVERY PARTNER
      // ==========================================

      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );


      if (!partner) {
        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });
      }


      // ==========================================
      // MAKE SURE PARTNER OWNS ORDER
      // ==========================================

      if (
        !order.deliveryPartnerId ||
        order.deliveryPartnerId.toString() !==
          partner._id.toString()
      ) {

        return res.status(403).json({
          error:
            "You are not assigned to this order.",
        });

      }


      // ==========================================
      // IMPORTANT:
      // DELIVERY PARTNER CANNOT MARK
      // OUT FOR DELIVERY
      // ==========================================

      if (
        status ===
        "Out for Delivery"
      ) {

        return res.status(403).json({
          error:
            "Only the restaurant can mark the order as Out for Delivery.",
        });

      }


      // ==========================================
      // DELIVERY PARTNER → DELIVERED
      // ==========================================

      if (
        status ===
        "Delivered"
      ) {

        // Order must currently be
        // Out for Delivery

        if (
          order.status !==
          "Out for Delivery"
        ) {

          return res.status(400).json({
            error:
              "Order must be Out for Delivery before it can be delivered.",
          });

        }


        // Mark order delivered
        order.status =
          "Delivered";

        await order.save();


        // ========================================
        // CALCULATE DELIVERY EARNING
        // ========================================

        const deliveryEarning =
          Number(
            order.totalAmount || 0
          ) * 0.1;


        // ========================================
        // UPDATE PARTNER
        //
        // Using findByIdAndUpdate prevents
        // required document validation errors.
        // ========================================

        await DeliveryPartner.findByIdAndUpdate(
          partner._id,
          {
            $inc: {
              totalDeliveries: 1,
              totalEarnings:
                deliveryEarning,
              walletBalance:
                deliveryEarning,
            },

            $set: {
              currentOrderId:
                null,
            },
          },
          {
            new: true,
            runValidators: false,
          }
        );


        console.log(
          "ORDER DELIVERED:",
          order._id
        );

        console.log(
          "PARTNER FREED:",
          partner._id
        );


        return res.json({
          success: true,
          message:
            "Order delivered successfully.",
          order,
        });

      }


      // ==========================================
      // INVALID STATUS
      // ==========================================

      return res.status(400).json({
        error:
          "Invalid delivery status update.",
      });


    } catch (error) {

      console.error(
        "UPDATE DELIVERY STATUS ERROR:",
        error
      );

      return res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// DASHBOARD
// ======================================================

router.get(
  "/dashboard",
  authMiddleware,
  async (req, res) => {

    try {

      const partner =
        await DeliveryPartner.findById(
          req.user.id
        ).select(
          "-password"
        );


      if (!partner) {
        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });
      }


      const activeOrder =
        await Order.findOne({
          deliveryPartnerId:
            req.user.id,

          status: {
            $in: [
              "Accepted by Delivery",
              "Out for Delivery",
            ],
          },

        }).populate(
          "restaurantId",
          "restaurantName address"
        );


      return res.json({

        walletBalance:
          partner.walletBalance,

        totalDeliveries:
          partner.totalDeliveries,

        totalEarnings:
          partner.totalEarnings,

        isOnline:
          partner.isOnline,

        activeOrder,

      });


    } catch (error) {

      console.error(
        "DELIVERY DASHBOARD ERROR:",
        error
      );


      return res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// DELIVERY HISTORY
// ======================================================

router.get(
  "/history",
  authMiddleware,
  async (req, res) => {

    try {

      const orders =
        await Order.find({
          deliveryPartnerId:
            req.user.id,

          status:
            "Delivered",

        })
        .sort({
          createdAt:
            -1,
        })
        .populate(
          "restaurantId",
          "restaurantName address"
        );


      return res.json(
        orders
      );


    } catch (error) {

      console.error(
        "DELIVERY HISTORY ERROR:",
        error
      );


      return res.status(500).json({
        error:
          error.message,
      });

    }

  }
);


// ======================================================
// UPDATE LIVE LOCATION
// ======================================================

router.put(
  "/update-location",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        latitude,
        longitude,
      } = req.body;


      if (
        latitude === undefined ||
        longitude === undefined
      ) {

        return res.status(400).json({
          error:
            "Latitude and longitude are required.",
        });

      }


      const partner =
        await DeliveryPartner.findById(
          req.user.id
        );


      if (!partner) {

        return res.status(404).json({
          error:
            "Delivery partner not found.",
        });

      }


      partner.currentLocation = {
        type: "Point",

        coordinates: [
          Number(longitude),
          Number(latitude),
        ],
      };


      await partner.save();


      return res.json({
        success: true,
        message:
          "Location updated.",
      });


    } catch (error) {

      console.error(
        "UPDATE LOCATION ERROR:",
        error
      );


      return res.status(500).json({
        error:
          "Failed to update location.",
      });

    }

  }
);


export default router;

