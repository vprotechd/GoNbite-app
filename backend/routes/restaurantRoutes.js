import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs"; // 👈 ADDED THIS (Essential for Windows)
import { fileURLToPath } from "url"; 

// Import your controllers and middleware
import * as restaurantController from "../controllers/restaurantController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ BULLETPROOF MULTER SETUP FOR WINDOWS
const uploadPath = path.join(__dirname, '../uploads');

// 1. Check if the folder exists. If not, create it.
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log("✅ Created 'uploads' folder at:", uploadPath);
} else {
  console.log("✅ 'uploads' folder already exists at:", uploadPath);
}

// 2. Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // 👇 OPTIONAL: Remove spaces from original names to prevent web crashes
    const cleanName = file.originalname.replace(/\s/g, '_'); 
    cb(null, Date.now() + path.extname(cleanName));
  },
});

const upload = multer({ storage });

// --- PUBLIC ROUTES ---
router.post(
  "/register",
  upload.single("image"),
  restaurantController.registerRestaurant,
);
router.post("/login", restaurantController.loginRestaurant);

// --- PROTECTED ROUTES ---
router.use(authMiddleware);

router.get("/profile", restaurantController.getRestaurantProfile);
router.put("/availability", restaurantController.toggleAvailability);

// --- FOOD CRUD ROUTES ---
router.get("/food", restaurantController.getFoodItems);
router.post("/food", upload.single("image"), restaurantController.addFoodItem);
router.put(
  "/food/:id",
  upload.single("image"),
  restaurantController.updateFoodItem,
);
router.delete("/food/:id", restaurantController.deleteFoodItem);

// --- ORDER ROUTES ---
router.get("/orders", restaurantController.getOrders);
router.put("/orders/:id/status", restaurantController.updateOrderStatus);

// --- DASHBOARD ROUTES ---
router.get("/dashboard", restaurantController.getDashboardStats);

export default router;