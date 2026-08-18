import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, // 👈 THIS MUST BE HERE
    trim: true 
  },
  discountPercentage: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  expiresAt: { 
    type: Date 
  },
  minOrderAmount: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

const Coupon = mongoose.model("Coupon", CouponSchema);
export default Coupon;