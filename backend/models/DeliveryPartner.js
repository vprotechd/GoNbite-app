import mongoose from "mongoose";

const DeliveryPartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  vehicleType: { type: String, enum: ["Bike", "Scooter", "Car"], default: "Bike" },
  
  isVerified: { type: Boolean, default: false },
  isOnline: { type: Boolean, default: false },
  
  // 📍 LIVE LOCATION (GeoJSON format for real-time tracking)
  currentLocation: {
    type: { type: String, default: "Point" },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  
  walletBalance: { type: Number, default: 0 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  
  currentOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null },
}, { timestamps: true });

DeliveryPartnerSchema.index({ currentLocation: "2dsphere" });

export default mongoose.model("DeliveryPartner", DeliveryPartnerSchema);