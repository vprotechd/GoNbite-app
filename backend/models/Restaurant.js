import mongoose from "mongoose";

const RestaurantSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, required: true },
    ownerName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    cuisineType: { type: String },
    // 🔥 NEW VERIFICATION FIELD 🔥
    isVerified: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false }, // Only turn true AFTER verification
    openingHours: { type: String },

    // 👇 ADD THIS NEW LINE 👇
    imageUrl: { type: String, default: "" }, // Stores the path to the uploaded image
  },
  { timestamps: true },
);

const Restaurant = mongoose.model("Restaurant", RestaurantSchema);
export default Restaurant;
