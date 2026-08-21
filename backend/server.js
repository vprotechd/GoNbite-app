import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

// =====================================================
// IMPORT ROUTES
// =====================================================

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import publicRoutes from "./routes/publicRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import offerRoutes  from "./routes/offerRoutes.js";
import publicOfferRoutes from "./routes/publicOfferRoutes.js";

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// ES MODULE DIRECTORY
// =====================================================

const __filename = fileURLToPath(
  import.meta.url
);

const __dirname = path.dirname(
  __filename
);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({
  extended: true,
}));

// =====================================================
// STATIC UPLOADS
// =====================================================

const uploadsPath = path.join(
  __dirname,
  "uploads"
);

app.use(
  "/uploads",
  express.static(uploadsPath)
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Food Delivery API is running",
  });
});

// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/restaurant",
  restaurantRoutes
);

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/public",
  publicRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/coupon",
  couponRoutes
);

app.use(
  "/api/delivery",
  deliveryRoutes
);

app.use(
  "/api/reviews",
  reviewRoutes
);

app.use((req, res, next) => {
  console.log("=================================");
  console.log("INCOMING REQUEST");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("=================================");
  next();
});

app.use("/api/admin/offers", offerRoutes);

app.use("/api/public/offers", publicOfferRoutes);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    error: "API route not found.",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((error, req, res, next) => {
  console.error(
    "GLOBAL ERROR:",
    error
  );

  res.status(
    error.status || 500
  ).json({
    error:
      error.message ||
      "Internal server error.",
  });
});

// =====================================================
// PORT
// =====================================================

const PORT =
  process.env.PORT || 5000;

// =====================================================
// DATABASE + SERVER
// =====================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected"
    );

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `Server running on port ${PORT}`
        );

        console.log(
          `Uploads directory: ${uploadsPath}`
        );
      }
    );
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error
    );

    process.exit(1);
  });