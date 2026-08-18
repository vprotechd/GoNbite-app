import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

import Review from "../models/Review.js";
import Order from "../models/Order.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


// =====================================================
// IMAGE UPLOAD CONFIGURATION
// =====================================================

const uploadDir = "uploads/reviews";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }
  },
});


// =====================================================
// CREATE REVIEW
// =====================================================

router.post(
  "/create",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        orderId,
        rating,
        comment,
      } = req.body;

      // -----------------------------------------------
      // Validate required fields
      // -----------------------------------------------

      if (!orderId || !rating) {
        return res.status(400).json({
          error: "Order ID and rating are required.",
        });
      }

      // -----------------------------------------------
      // Validate rating
      // -----------------------------------------------

      const numericRating = Number(rating);

      if (
        !Number.isInteger(numericRating) ||
        numericRating < 1 ||
        numericRating > 5
      ) {
        return res.status(400).json({
          error: "Rating must be between 1 and 5.",
        });
      }

      // -----------------------------------------------
      // Find order
      // -----------------------------------------------

      const order = await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      // -----------------------------------------------
      // IMPORTANT:
      // Only delivered orders can be reviewed
      // -----------------------------------------------

      if (order.status !== "Delivered") {
        return res.status(400).json({
          error: "You can review an order only after it is delivered.",
        });
      }

      // -----------------------------------------------
      // Make sure this customer owns the order
      // -----------------------------------------------

      if (order.customerName !== req.user.name) {
        return res.status(403).json({
          error: "You are not allowed to review this order.",
        });
      }

      // -----------------------------------------------
      // Check whether already reviewed
      // -----------------------------------------------

      const existingReview = await Review.findOne({
        orderId: order._id,
      });

      if (existingReview) {
        return res.status(400).json({
          error: "You have already reviewed this order.",
        });
      }

      // -----------------------------------------------
      // Image URL
      // -----------------------------------------------

      let imageUrl = "";

      if (req.file) {
        imageUrl = `/uploads/reviews/${req.file.filename}`;
      }

      // -----------------------------------------------
      // Create review
      // -----------------------------------------------

      const review = new Review({
        orderId: order._id,
        restaurantId: order.restaurantId,
        customerName: order.customerName,
        rating: numericRating,
        comment: comment || "",
        image: imageUrl,
      });

      await review.save();

      // -----------------------------------------------
      // Response
      // -----------------------------------------------

      res.status(201).json({
        message: "Review submitted successfully.",
        review,
      });

    } catch (error) {
      console.error("CREATE REVIEW ERROR:", error);

      res.status(500).json({
        error: "Failed to submit review.",
      });
    }
  }
);


// =====================================================
// GET REVIEWS FOR RESTAURANT
// =====================================================

router.get(
  "/restaurant/:restaurantId",
  async (req, res) => {
    try {
      const reviews = await Review.find({
        restaurantId: req.params.restaurantId,
      }).sort({
        createdAt: -1,
      });

      res.json(reviews);

    } catch (error) {
      console.error("GET RESTAURANT REVIEWS ERROR:", error);

      res.status(500).json({
        error: "Failed to fetch reviews.",
      });
    }
  }
);


// =====================================================
// GET REVIEW FOR ORDER
// =====================================================

router.get(
  "/order/:orderId",
  authMiddleware,
  async (req, res) => {
    try {
      const order = await Order.findById(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          error: "Order not found.",
        });
      }

      if (order.customerName !== req.user.name) {
        return res.status(403).json({
          error: "Not authorized.",
        });
      }

      const review = await Review.findOne({
        orderId: req.params.orderId,
      });

      res.json({
        reviewed: !!review,
        review: review || null,
      });

    } catch (error) {
      console.error("GET ORDER REVIEW ERROR:", error);

      res.status(500).json({
        error: "Failed to check review.",
      });
    }
  }
);


export default router;