import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Order from "../models/Order.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// INITIALIZE RAZORPAY
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
  "/create-razorpay-order",
  authMiddleware,
  async (req, res) => {
    try {
      const { amount } = req.body;

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order = await razorpay.orders.create(options);

      res.json(order);
    } catch (error) {
      console.error(
        "🔥🔥🔥 RAZORPAY ORDER ERROR:",
        error
      );

      res.status(500).json({
        error: "Failed to create payment order.",
      });
    }
  }
);

// =====================================================
// PLACE AN ORDER
// =====================================================

router.post(
  "/create",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(
        "🔍 ORDER DATA RECEIVED:",
        req.body
      );

      console.log(
        "🔍 USER DATA:",
        req.user
      );

      const {
        restaurantId,
        items,
        totalAmount,
        deliveryAddress,
        deliveryLocation,
        paymentMethod,
      } = req.body;

      // -----------------------------------------------
      // VALIDATE RESTAURANT ID
      // -----------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          restaurantId
        )
      ) {
        console.warn(
          "⚠️ Invalid restaurantId received:",
          restaurantId
        );

        return res.status(400).json({
          error:
            "Invalid or missing restaurant ID. Please refresh your cart and try again.",
        });
      }

      // -----------------------------------------------
      // VALIDATE ORDER DETAILS
      // -----------------------------------------------

      if (
        !items ||
        items.length === 0 ||
        !deliveryAddress
      ) {
        return res.status(400).json({
          error:
            "Missing required order details.",
        });
      }

      // -----------------------------------------------
      // CUSTOMER PHONE
      // -----------------------------------------------

      const customerPhone =
        req.user && req.user.phone
          ? req.user.phone
          : "0000000000";

      // -----------------------------------------------
      // CREATE ORDER
      // -----------------------------------------------

      const newOrder = new Order({
        restaurantId:
          new mongoose.Types.ObjectId(
            restaurantId
          ),

        customerId: req.user.id,

        customerName: req.user.name,

        customerPhone: customerPhone,

        deliveryAddress,

        // 📍 CUSTOMER DELIVERY LOCATION
        deliveryLocation: {
          latitude:
            deliveryLocation?.latitude ?? null,

          longitude:
            deliveryLocation?.longitude ?? null,
        },

        items,

        totalAmount,

        paymentMethod:
          paymentMethod ||
          "Cash on Delivery",

        status: "Pending",
      });

      await newOrder.save();

      console.log(
        "✅ Order saved successfully to DB with ID:",
        newOrder._id
      );

      console.log(
        "📍 CUSTOMER LOCATION SAVED:",
        newOrder.deliveryLocation
      );

      res.status(201).json({
        message:
          "Order placed successfully!",

        order: newOrder,
      });
    } catch (error) {
      console.error(
        "🔥🔥🔥 BACKEND ORDER CRASHED:",
        error
      );

      res.status(500).json({
        error:
          "Internal server error. Please try again later.",
      });
    }
  }
);

// =====================================================
// GET USER ORDERS
// =====================================================

router.get(
  "/my-orders",
  authMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find({
        customerId: req.user.id,

        hiddenFromHistory: {
          $ne: true,
        },
      }).sort({
        createdAt: -1,
      });

      res.json(orders);
    } catch (error) {
      console.error(
        "Error fetching orders:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch orders.",
      });
    }
  }
);

// =====================================================
// TRACK ACTIVE ORDER
// =====================================================
//
// GET:
// /api/orders/:orderId/track
//
// Customer can only track their own order.
//
// =====================================================

router.get(
  "/:orderId/track",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      console.log(
        "📍 TRACK ORDER REQUEST:",
        orderId
      );

      // -----------------------------------------------
      // VALIDATE ORDER ID
      // -----------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid order ID.",
        });
      }

      // -----------------------------------------------
      // FIND CUSTOMER'S ORDER
      // -----------------------------------------------

      const order = await Order.findOne({
        _id: orderId,
        customerId: req.user.id,
      })
        .populate(
          "deliveryPartnerId",
          "name phone vehicleType"
        )
        .populate(
          "restaurantId",
          "restaurantName address phone latitude longitude"
        );

      // -----------------------------------------------
      // ORDER NOT FOUND
      // -----------------------------------------------

      if (!order) {
        return res.status(404).json({
          error:
            "Order not found.",
        });
      }

      // -----------------------------------------------
      // DELIVERY PARTNER DATA
      // -----------------------------------------------

      let deliveryPartner = null;

      if (order.deliveryPartnerId) {
        deliveryPartner = {
          id: order.deliveryPartnerId._id,

          name:
            order.deliveryPartnerId.name,

          phone:
            order.deliveryPartnerId.phone,

          vehicleType:
            order.deliveryPartnerId
              .vehicleType,
        };
      }

      // -----------------------------------------------
      // LATEST DELIVERY PARTNER LOCATION
      // -----------------------------------------------

      let deliveryPartnerLocation = null;

      // First priority:
      // Location saved directly on Order
      if (
        order.deliveryPartnerLocation &&
        typeof order.deliveryPartnerLocation
          .latitude === "number" &&
        typeof order.deliveryPartnerLocation
          .longitude === "number"
      ) {
        deliveryPartnerLocation = {
          latitude:
            order.deliveryPartnerLocation
              .latitude,

          longitude:
            order.deliveryPartnerLocation
              .longitude,

          updatedAt:
            order.deliveryPartnerLocation
              .updatedAt,
        };
      }

      // -----------------------------------------------
      // FALLBACK TO DELIVERY PARTNER LOCATION
      // -----------------------------------------------

      if (
        !deliveryPartnerLocation &&
        order.deliveryPartnerId
      ) {
        const partner =
          await DeliveryPartner.findById(
            order.deliveryPartnerId._id
          ).select(
            "currentLocation"
          );

        if (
          partner &&
          partner.currentLocation &&
          Array.isArray(
            partner.currentLocation
              .coordinates
          ) &&
          partner.currentLocation
            .coordinates.length === 2
        ) {
          const [
            longitude,
            latitude,
          ] =
            partner.currentLocation
              .coordinates;

          // Ignore default [0, 0]
          if (
            longitude !== 0 ||
            latitude !== 0
          ) {
            deliveryPartnerLocation = {
              latitude,
              longitude,
              updatedAt: null,
            };
          }
        }
      }

      // -----------------------------------------------
      // CUSTOMER LOCATION
      // -----------------------------------------------

      let customerLocation = null;

      if (
        order.deliveryLocation &&
        typeof order.deliveryLocation
          .latitude === "number" &&
        typeof order.deliveryLocation
          .longitude === "number"
      ) {
        customerLocation = {
          latitude:
            order.deliveryLocation.latitude,

          longitude:
            order.deliveryLocation.longitude,
        };
      }

      // -----------------------------------------------
      // RESTAURANT LOCATION
      // -----------------------------------------------

      let restaurantLocation = null;

      if (
        order.restaurantId &&
        typeof order.restaurantId.latitude ===
          "number" &&
        typeof order.restaurantId.longitude ===
          "number"
      ) {
        restaurantLocation = {
          latitude:
            order.restaurantId.latitude,

          longitude:
            order.restaurantId.longitude,
        };
      }

      // -----------------------------------------------
      // RESPONSE
      // -----------------------------------------------

      res.json({
        success: true,

        // ---------------------------------------------
        // ORDER
        // ---------------------------------------------

        order: {
          id: order._id,

          status: order.status,

          customerName:
            order.customerName,

          customerPhone:
            order.customerPhone,

          deliveryAddress:
            order.deliveryAddress,

          items:
            order.items,

          totalAmount:
            order.totalAmount,

          paymentMethod:
            order.paymentMethod,

          paymentStatus:
            order.paymentStatus,

          deliveryOtp:
            order.deliveryOtp,

          createdAt:
            order.createdAt,

          updatedAt:
            order.updatedAt,
        },

        // ---------------------------------------------
        // RESTAURANT
        // ---------------------------------------------

        restaurant:
          order.restaurantId
            ? {
                id:
                  order.restaurantId._id,

                name:
                  order.restaurantId
                    .restaurantName,

                address:
                  order.restaurantId.address,

                phone:
                  order.restaurantId.phone,

                latitude:
                  order.restaurantId.latitude,

                longitude:
                  order.restaurantId.longitude,
              }
            : null,

        // ---------------------------------------------
        // CUSTOMER LOCATION
        // ---------------------------------------------

        customerLocation,

        // ---------------------------------------------
        // RESTAURANT LOCATION
        // ---------------------------------------------

        restaurantLocation,

        // ---------------------------------------------
        // DELIVERY PARTNER
        // ---------------------------------------------

        deliveryPartner,

        // ---------------------------------------------
        // DELIVERY PARTNER LOCATION
        // ---------------------------------------------

        deliveryPartnerLocation,
      });
    } catch (error) {
      console.error(
        "🔥 TRACK ORDER ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch tracking information.",
      });
    }
  }
);

// =====================================================
// REMOVE ORDER FROM HISTORY
// =====================================================

router.delete(
  "/:orderId/history",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // -----------------------------------------------
      // VALIDATE ORDER ID
      // -----------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid order ID.",
        });
      }

      // -----------------------------------------------
      // FIND USER'S ORDER
      // -----------------------------------------------

      const order =
        await Order.findOne({
          _id: orderId,

          customerId: req.user.id,
        });

      if (!order) {
        return res.status(404).json({
          error:
            "Order not found.",
        });
      }

      // -----------------------------------------------
      // HIDE FROM HISTORY
      // -----------------------------------------------

      order.hiddenFromHistory = true;

      await order.save();

      res.json({
        message:
          "Order removed from your history.",
      });
    } catch (error) {
      console.error(
        "REMOVE ORDER FROM HISTORY ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to remove order from history.",
      });
    }
  }
);

export default router;

