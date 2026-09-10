import express from "express";
import multer from "multer";
import { identifyFood } from "../controllers/foodScanController.js";

const router = express.Router();

// Store uploaded image temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/identify",
  upload.single("image"),
  identifyFood
);

export default router;