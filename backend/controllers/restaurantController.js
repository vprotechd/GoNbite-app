import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import FoodItem from "../models/FoodItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

// --- AUTH CONTROLLERS ---
// 1. Register Restaurant (Handles the uploaded image)
// --- AUTH CONTROLLERS ---

// 1. Register Restaurant
export const registerRestaurant = async (req, res) => {
  try {
    console.log("📦 REQ BODY:", req.body);
    console.log("📷 REQ FILE:", req.file);

    const {
      restaurantName,
      ownerName,
      email,
      password,
      phone,
      address,
    } = req.body;

    // Validate required fields
    if (
      !restaurantName ||
      !ownerName ||
      !email ||
      !password ||
      !phone ||
      !address
    ) {
      return res.status(400).json({
        error: "Please fill in all required fields.",
      });
    }

    // Check if restaurant already exists
    const existingRestaurant = await Restaurant.findOne({ email });

    if (existingRestaurant) {
      return res.status(409).json({
        error: "A restaurant with this email already exists.",
      });
    }

    // Upload image path
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create restaurant
    const restaurant = new Restaurant({
      restaurantName,
      ownerName,
      email,
      password: hashedPassword,
      phone,
      address,
      imageUrl,

      // Explicitly pending admin approval
      isVerified: false,
      isAvailable: false,
    });

    await restaurant.save();

    console.log(
      "✅ RESTAURANT REGISTERED:",
      restaurant.restaurantName,
      "| Verified:",
      restaurant.isVerified
    );

    return res.status(201).json({
      message:
        "Restaurant registered successfully. Please wait for Admin approval.",
      restaurant: {
        id: restaurant._id,
        restaurantName: restaurant.restaurantName,
        email: restaurant.email,
        isVerified: restaurant.isVerified,
      },
    });
  } catch (error) {
    console.error("❌ RESTAURANT REGISTRATION ERROR:", error);

    // Duplicate email protection
    if (error.code === 11000) {
      return res.status(409).json({
        error: "A restaurant with this email already exists.",
      });
    }

    return res.status(500).json({
      error: error.message || "Restaurant registration failed.",
    });
  }
};

// 2. Login Restaurant (Blocks unverified users)
export const loginRestaurant = async (req, res) => {
  try {
    const { email, password } = req.body;
    const restaurant = await Restaurant.findOne({ email });
    if (!restaurant)
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, restaurant.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Block if not verified by Admin
    if (!restaurant.isVerified) {
      return res.status(403).json({
        error:
          "Your account is pending admin verification. Please wait for approval.",
      });
    }

    const token = jwt.sign({ id: restaurant._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, restaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. Get Profile
export const getRestaurantProfile = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id).select(
      "-password",
    );
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- FOOD CRUD CONTROLLERS ---

export const addFoodItem = async (req, res) => {
  try {
    const { name, price, category, description } = req.body;
    // Adds a timestamp to force browser reload
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}?t=${Date.now()}`
      : "";
    const food = new FoodItem({
      name,
      price,
      category,
      description,
      imageUrl,
      restaurantId: req.restaurant.id,
    });
    await food.save();
    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getFoodItems = async (req, res) => {
  console.log("🔍 DEBUG: getFoodItems was called");
  console.log("🔍 DEBUG: req.restaurant =", req.restaurant);

  try {
    // If req.restaurant is undefined, this explicitly crashes so we see it
    if (!req.restaurant || !req.restaurant.id) {
      throw new Error(
        "❌ CRITICAL: req.restaurant.id is undefined! Auth middleware failed.",
      );
    }

    const food = await FoodItem.find({ restaurantId: req.restaurant.id });
    res.json(food);
  } catch (error) {
    console.error("🔥🔥🔥 BACKEND CRASHED WITH THIS ERROR:", error); // This prints the REAL error
    res.status(500).json({ error: error.message });
  }
};

export const updateFoodItem = async (req, res) => {
  try {
    const { name, price, category, description, isAvailable } = req.body;
    let updateData = { name, price, category, description, isAvailable };
    if (req.file)
      updateData.imageUrl = `/uploads/${req.file.filename}?t=${Date.now()}`;

    const food = await FoodItem.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurant.id },
      updateData,
      { new: true },
    );
    if (!food) return res.status(404).json({ error: "Item not found" });
    res.json(food);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteFoodItem = async (req, res) => {
  try {
    const food = await FoodItem.findOneAndDelete({
      _id: req.params.id,
      restaurantId: req.restaurant.id,
    });
    if (!food) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// --- ORDER CONTROLLERS ---

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ restaurantId: req.restaurant.id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({
      _id: req.params.id,
      restaurantId: req.restaurant.id,
    });

    if (!order) {
      return res.status(404).json({
        error: "Order not found.",
      });
    }

    // ==========================================
    // 1. RESTAURANT ACCEPTS ORDER
    // Pending → Accepted
    // ==========================================
    if (status === "Accepted") {
      if (order.status !== "Pending") {
        return res.status(400).json({
          error: "Only pending orders can be accepted.",
        });
      }

      order.status = "Accepted";

      await order.save();

      return res.json(order);
    }

    // ==========================================
    // 2. RESTAURANT REJECTS ORDER
    // Pending → Cancelled
    // ==========================================
    if (status === "Cancelled") {
      if (order.status !== "Pending") {
        return res.status(400).json({
          error: "Only pending orders can be rejected.",
        });
      }

      order.status = "Cancelled";

      await order.save();

      return res.json(order);
    }

    // ==========================================
    // 3. RESTAURANT STARTS PREPARING
    // Accepted → Preparing
    // ==========================================
    if (status === "Preparing") {
      if (order.status !== "Accepted") {
        return res.status(400).json({
          error: "Order must be accepted before preparation starts.",
        });
      }

      // Delivery partner can now see this order
      order.status = "Preparing";

      await order.save();

      return res.json(order);
    }

// ==========================================
// 4. RESTAURANT CONFIRMS FOOD PICKUP
// Accepted by Delivery → Out for Delivery
// ==========================================
if (status === "Out for Delivery") {
  // Delivery partner must have accepted first
  if (order.status !== "Accepted by Delivery") {
    return res.status(400).json({
      error:
        "Delivery partner must accept the order before food can be picked up.",
    });
  }

  // A delivery partner must be assigned
  if (!order.deliveryPartnerId) {
    return res.status(400).json({
      error: "No delivery partner is assigned to this order.",
    });
  }

  // Restaurant confirms that food has physically
  // been handed over to the delivery partner
  order.status = "Out for Delivery";

  await order.save();

  return res.json(order);
}
    // ==========================================
    // INVALID RESTAURANT STATUS
    // ==========================================
    return res.status(400).json({
      error: "Invalid restaurant status update.",
    });

  } catch (error) {
    console.error("UPDATE RESTAURANT ORDER STATUS ERROR:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};

// --- DASHBOARD & AVAILABILITY CONTROLLERS ---

export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const restaurantId = req.restaurant.id;

    const totalOrders = await Order.countDocuments({ restaurantId });
    const todayOrders = await Order.countDocuments({
      restaurantId,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const totalRevenueAgg = await Order.aggregate([
      { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          restaurantId: new mongoose.Types.ObjectId(restaurantId),
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      todayRevenue: todayRevenueAgg[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleAvailability = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id);
    restaurant.isAvailable = !restaurant.isAvailable;
    await restaurant.save();
    res.json({ isAvailable: restaurant.isAvailable });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
