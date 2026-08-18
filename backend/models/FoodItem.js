import mongoose from "mongoose";

const FoodItemSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: { type: String },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const FoodItem = mongoose.model("FoodItem", FoodItemSchema);
export default FoodItem;