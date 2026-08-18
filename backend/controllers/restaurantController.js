import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import FoodItem from "../models/FoodItem.js";
import Order from "../models/Order.js";
import Restaurant from "../models/Restaurant.js";

// --- AUTH CONTROLLERS ---
// 1. Register Restaurant (Handles the uploaded image)
export const registerRestaurant = async (req, res) => {
  try {
    console.log("📦 REQ BODY:", req.body); 
    console.log("📁 REQ FILE:", req.file); // Keep debugging logs

    const { restaurantName, ownerName, email, password, phone, address } = req.body;

    // ✅ FIXED: Uncommented the correct logic and removed hardcoded empty string
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";

    const hashedPassword = await bcrypt.hash(password, 10);
    const restaurant = new Restaurant({
      restaurantName,
      ownerName,
      email,
      password: hashedPassword,
      phone,
      address,
      imageUrl, // 👈 Now uses the real image URL
    });
    await restaurant.save();
    res.status(201).json({ message: "Restaurant registered successfully" });
  } catch (error) {
    console.error("❌ ERROR:", error); 
    res.status(500).json({ error: error.message });
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
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurantId: req.restaurant.id },
      { status },
      { new: true },
    );
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
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
