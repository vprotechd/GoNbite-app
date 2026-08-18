import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import Razorpay from 'razorpay'; 
import Order from '../models/Order.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ✅ CREATE RAZORPAY ORDER (For Online Payment)
router.post('/create-razorpay-order', authMiddleware, async (req, res) => {
  try {
    const { amount } = req.body;

    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error("🔥🔥🔥 RAZORPAY ORDER ERROR:", error);
    res.status(500).json({ error: "Failed to create payment order." });
  }
});

// ✅ PLACE AN ORDER (Cash on Delivery or after successful payment)
router.post('/create', authMiddleware, async (req, res) => {
  try {
    console.log("🔍 ORDER DATA RECEIVED:", req.body);
    console.log("🔍 USER DATA:", req.user);

    const { restaurantId, items, totalAmount, deliveryAddress, paymentMethod } = req.body;

    // ✅ 1. CHECK IF RESTAURANT ID EXISTS IN THE DB (More robust than ObjectId check)
    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      console.warn("⚠️ Invalid restaurantId received:", restaurantId);
      return res.status(400).json({ 
        error: "Invalid or missing restaurant ID. Please refresh your cart and try again." 
      });
    }

    // ✅ 2. Validate required fields
    if (!items || items.length === 0 || !deliveryAddress) {
      return res.status(400).json({ error: "Missing required order details." });
    }

    // ✅ 3. Safely handle missing phone number
    const customerPhone = (req.user && req.user.phone) ? req.user.phone : "0000000000";

    // ✅ 4. Create and save the order
    const newOrder = new Order({
      restaurantId: new mongoose.Types.ObjectId(restaurantId),
      customerName: req.user.name,
      customerPhone: customerPhone,
      deliveryAddress,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      status: 'Pending',
    });

    await newOrder.save();
    console.log("✅ Order saved successfully to DB with ID:", newOrder._id);

    res.status(201).json({ 
      message: 'Order placed successfully!', 
      order: newOrder 
    });

  } catch (error) {
    console.error("🔥🔥🔥 BACKEND ORDER CRASHED:", error); 
    res.status(500).json({ error: "Internal server error. Please try again later." });
  }
});

// ✅ GET USER ORDERS
router.get('/my-orders', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ customerName: req.user.name }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

export default router;