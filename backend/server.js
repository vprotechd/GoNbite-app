// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import mongoose from "mongoose";
// import path from "path";
// import { fileURLToPath } from "url";
// import { Server } from "socket.io";

// import paymentRoutes from "./routes/paymentRoutes.js";

// dotenv.config();

// // =====================================================
// // IMPORT ROUTES
// // =====================================================

// import adminRoutes from "./routes/adminRoutes.js";
// import authRoutes from "./routes/authRoutes.js";
// import couponRoutes from "./routes/couponRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";
// import publicRoutes from "./routes/publicRoutes.js";
// import restaurantRoutes from "./routes/restaurantRoutes.js";
// import deliveryRoutes from "./routes/deliveryRoutes.js";
// import reviewRoutes from "./routes/reviewRoutes.js";
// import offerRoutes from "./routes/offerRoutes.js";
// import publicOfferRoutes from "./routes/publicOfferRoutes.js";
// import foodScanRoutes from "./routes/foodScanRoutes.js";
// import notificationRoutes from "./routes/notificationRoutes.js";

// // =====================================================
// // APP
// // =====================================================

// const app = express();

// // =====================================================
// // ES MODULE DIRECTORY
// // =====================================================

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // =====================================================
// // MIDDLEWARE
// // =====================================================

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   })
// );

// app.use(
//   "/api/food-scan",
//   foodScanRoutes
// );

// app.use(express.json());

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

// app.use((req, res, next) => {
//   console.log("REQUEST:", req.method, req.originalUrl);
//   next();
// });

// app.use(
//   "/api/notifications",
//   notificationRoutes
// );

// // =====================================================
// // STATIC UPLOADS
// // =====================================================

// const uploadsPath = path.join(
//   __dirname,
//   "uploads"
// );

// app.use(
//   "/uploads",
//   express.static(uploadsPath)
// );

// // =====================================================
// // HEALTH CHECK
// // =====================================================

// app.get("/", (req, res) => {
//   res.status(200).json({
//     message: "Food Delivery API is running",
//   });
// });

// // =====================================================
// // PAYMENT ROUTES
// // =====================================================

// app.use(
//   "/api/payments",
//   paymentRoutes
// );

// // =====================================================
// // API ROUTES
// // =====================================================

// app.use(
//   "/api/auth",
//   authRoutes
// );

// app.use(
//   "/api/restaurant",
//   restaurantRoutes
// );

// app.use(
//   "/api/admin",
//   adminRoutes
// );

// app.use(
//   "/api/public",
//   publicRoutes
// );

// app.use(
//   "/api/orders",
//   orderRoutes
// );

// app.use(
//   "/api/coupon",
//   couponRoutes
// );

// app.use(
//   "/api/delivery",
//   deliveryRoutes
// );

// app.use(
//   "/api/reviews",
//   reviewRoutes
// );

// app.use((req, res, next) => {
//   console.log("=================================");
//   console.log("INCOMING REQUEST");
//   console.log("METHOD:", req.method);
//   console.log("URL:", req.originalUrl);
//   console.log("=================================");
//   next();
// });

// app.use(
//   "/api/admin/offers",
//   offerRoutes
// );

// app.use(
//   "/api/public/offers",
//   publicOfferRoutes
// );

// // =====================================================
// // 404 HANDLER
// // =====================================================

// app.use((req, res) => {
//   res.status(404).json({
//     error: "API route not found.",
//     path: req.originalUrl,
//   });
// });

// // =====================================================
// // GLOBAL ERROR HANDLER
// // =====================================================

// app.use((error, req, res, next) => {
//   console.error(
//     "GLOBAL ERROR:",
//     error
//   );

//   res.status(
//     error.status || 500
//   ).json({
//     error:
//       error.message ||
//       "Internal server error.",
//   });
// });

// // =====================================================
// // PORT
// // =====================================================

// const PORT =
//   process.env.PORT || 5000;

// // =====================================================
// // CREATE HTTP SERVER
// // =====================================================
// //
// // IMPORTANT:
// // We use Node's HTTP server instead of app.listen()
// // because Socket.IO needs to attach to the same server.
// //

// import { createServer } from "http";

// const httpServer = createServer(app);

// // =====================================================
// // SOCKET.IO
// // =====================================================

// const io = new Server(
//   httpServer,
//   {
//     cors: {
//       origin: "*",
//       methods: [
//         "GET",
//         "POST",
//       ],
//     },
//   }
// );

// // =====================================================
// // SOCKET.IO CONNECTION
// // =====================================================

// io.on(
//   "connection",
//   (socket) => {

//     console.log(
//       "🟢 Socket connected:",
//       socket.id
//     );

//     // =================================================
//     // JOIN ORDER ROOM
//     // =================================================
//     //
//     // Delivery partner and customer both join
//     // the room belonging to the order.
//     //
//     // Example:
//     // order:68abc123
//     //

//     socket.on(
//       "joinOrder",
//       (orderId) => {

//         if (!orderId) {
//           console.log(
//             "❌ joinOrder: orderId missing"
//           );

//           return;
//         }

//         const room =
//           `order:${orderId}`;

//         socket.join(room);

//         console.log(
//           `📦 Socket ${socket.id} joined ${room}`
//         );

//       }
//     );

//     // =================================================
//     // DELIVERY PARTNER LOCATION
//     // =================================================
//     //
//     // Delivery partner sends:
//     //
//     // {
//     //   orderId,
//     //   latitude,
//     //   longitude
//     // }
//     //
//     // Server broadcasts it to everyone else
//     // inside the same order room.
//     //

//     socket.on(
//       "deliveryLocationUpdate",
//       (data) => {

//         try {

//           const {
//             orderId,
//             latitude,
//             longitude,
//           } = data || {};

//           if (
//             !orderId ||
//             typeof latitude !== "number" ||
//             typeof longitude !== "number"
//           ) {

//             console.log(
//               "❌ Invalid location update:",
//               data
//             );

//             return;
//           }

//           const room =
//             `order:${orderId}`;

//           console.log(
//             "📍 Delivery location:",
//             {
//               orderId,
//               latitude,
//               longitude,
//             }
//           );

//           // Send location to customer
//           // and other users in this order room.
//           socket.to(room).emit(
//             "deliveryLocationUpdate",
//             {
//               orderId,
//               latitude,
//               longitude,
//             }
//           );

//         } catch (error) {

//           console.error(
//             "❌ Socket location error:",
//             error
//           );

//         }

//       }
//     );

//     // =================================================
//     // SOCKET DISCONNECT
//     // =================================================

//     socket.on(
//       "disconnect",
//       (reason) => {

//         console.log(
//           "🔴 Socket disconnected:",
//           socket.id,
//           "Reason:",
//           reason
//         );

//       }
//     );

//   }
// );

// // =====================================================
// // DATABASE + SERVER
// // =====================================================

// mongoose
//   .connect(
//     process.env.MONGO_URI
//   )
//   .then(() => {

//     console.log(
//       "MongoDB connected"
//     );

//     console.log(
//       "Razorpay Key:",
//       process.env.RAZORPAY_KEY_ID
//         ? "LOADED"
//         : "MISSING"
//     );

//     console.log(
//       "Razorpay Secret:",
//       process.env.RAZORPAY_KEY_SECRET
//         ? "LOADED"
//         : "MISSING"
//     );

//     httpServer.listen(
//       PORT,
//       "0.0.0.0",
//       () => {

//         console.log(
//           `🚀 Server running on port ${PORT}`
//         );

//         console.log(
//           `🔌 Socket.IO running on port ${PORT}`
//         );

//         console.log(
//           `📁 Uploads directory: ${uploadsPath}`
//         );

//       }
//     );

//   })
//   .catch((error) => {

//     console.error(
//       "MongoDB connection failed:",
//       error
//     );

//     process.exit(1);

//   });





import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";

import paymentRoutes from "./routes/paymentRoutes.js";

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
import offerRoutes from "./routes/offerRoutes.js";
import publicOfferRoutes from "./routes/publicOfferRoutes.js";
import foodScanRoutes from "./routes/foodScanRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

// =====================================================
// SOCKET.IO
// =====================================================

import { initializeSocket } from "./socket.js";

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// ES MODULE DIRECTORY
// =====================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(
  "/api/food-scan",
  foodScanRoutes
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use((req, res, next) => {
  console.log("REQUEST:", req.method, req.originalUrl);
  next();
});

app.use(
  "/api/notifications",
  notificationRoutes
);

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
// PAYMENT ROUTES
// =====================================================

app.use(
  "/api/payments",
  paymentRoutes
);

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

app.use(
  "/api/admin/offers",
  offerRoutes
);

app.use(
  "/api/public/offers",
  publicOfferRoutes
);

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
// CREATE HTTP SERVER
// =====================================================
//
// IMPORTANT:
// We use Node's HTTP server instead of app.listen()
// because Socket.IO needs to attach to the same server.
//

const httpServer = createServer(app);

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================
//
// Socket.IO logic is now handled inside socket.js
//

initializeSocket(httpServer);

// =====================================================
// DATABASE + SERVER
// =====================================================

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {

    console.log(
      "MongoDB connected"
    );

    console.log(
      "Razorpay Key:",
      process.env.RAZORPAY_KEY_ID
        ? "LOADED"
        : "MISSING"
    );

    console.log(
      "Razorpay Secret:",
      process.env.RAZORPAY_KEY_SECRET
        ? "LOADED"
        : "MISSING"
    );

    httpServer.listen(
      PORT,
      "0.0.0.0",
      () => {

        console.log(
          `🚀 Server running on port ${PORT}`
        );

        console.log(
          `🔌 Socket.IO running on port ${PORT}`
        );

        console.log(
          `📁 Uploads directory: ${uploadsPath}`
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