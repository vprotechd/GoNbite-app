import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from './models/Coupon.js';

dotenv.config();

const seedCoupon = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to DB");

    const newCoupon = new Coupon({
      code: "SAVE10",
      discountPercentage: 10,
      isActive: true,
      expiresAt: new Date("2026-12-31"),
      minOrderAmount: 100
    });

    await newCoupon.save();
    console.log("✅ Coupon 'SAVE10' created successfully!");
    process.exit();
  } catch (error) {
    console.error("Error seeding coupon:", error);
    process.exit(1);
  }
};

seedCoupon();