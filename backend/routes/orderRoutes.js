// import dotenv from "dotenv";
// dotenv.config();

// import express from "express";
// import mongoose from "mongoose";
// import Razorpay from "razorpay";

// import Order from "../models/Order.js";
// import DeliveryPartner from "../models/DeliveryPartner.js";
// import authMiddleware from "../middleware/authMiddleware.js";

// const router = express.Router();

// // =====================================================
// // INITIALIZE RAZORPAY
// // =====================================================

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // =====================================================
// // CREATE RAZORPAY ORDER
// // =====================================================

// router.post(
//   "/create-razorpay-order",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { amount } = req.body;

//       const options = {
//         amount: amount * 100,
//         currency: "INR",
//         receipt: `receipt_${Date.now()}`,
//       };

//       const order = await razorpay.orders.create(options);

//       res.json(order);
//     } catch (error) {
//       console.error(
//         "🔥🔥🔥 RAZORPAY ORDER ERROR:",
//         error
//       );

//       res.status(500).json({
//         error: "Failed to create payment order.",
//       });
//     }
//   }
// );

// // =====================================================
// // PLACE AN ORDER
// // =====================================================

// router.post(
//   "/create",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       console.log(
//         "🔍 ORDER DATA RECEIVED:",
//         req.body
//       );

//       console.log(
//         "🔍 USER DATA:",
//         req.user
//       );

//       const {
//         restaurantId,
//         items,
//         totalAmount,
//         deliveryAddress,
//         deliveryLocation,
//         paymentMethod,
//       } = req.body;

//       console.log(
//   "📍 DELIVERY LOCATION RECEIVED IN BACKEND:",
//   deliveryLocation
// );

//       // -----------------------------------------------
//       // VALIDATE RESTAURANT ID
//       // -----------------------------------------------

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           restaurantId
//         )
//       ) {
//         console.warn(
//           "⚠️ Invalid restaurantId received:",
//           restaurantId
//         );

//         return res.status(400).json({
//           error:
//             "Invalid or missing restaurant ID. Please refresh your cart and try again.",
//         });
//       }

//       // -----------------------------------------------
//       // VALIDATE ORDER DETAILS
//       // -----------------------------------------------

//       if (
//         !items ||
//         items.length === 0 ||
//         !deliveryAddress
//       ) {
//         return res.status(400).json({
//           error:
//             "Missing required order details.",
//         });
//       }

//       // -----------------------------------------------
//       // CUSTOMER PHONE
//       // -----------------------------------------------

//       const customerPhone =
//         req.user && req.user.phone
//           ? req.user.phone
//           : "0000000000";

//     // -----------------------------------------------
// // CREATE ORDER
// // -----------------------------------------------

// console.log(
//   "📍 DELIVERY LOCATION RECEIVED IN BACKEND:",
//   deliveryLocation
// );

// const newOrder = new Order({
//   restaurantId:
//     new mongoose.Types.ObjectId(
//       restaurantId
//     ),

//   customerId: req.user.id,

//   customerName: req.user.name,

//   customerPhone: customerPhone,

//   deliveryAddress,

//   // 📍 CUSTOMER DELIVERY LOCATION
//   deliveryLocation: {
//     latitude:
//       deliveryLocation?.latitude ?? null,

//     longitude:
//       deliveryLocation?.longitude ?? null,
//   },

//   items,

//   totalAmount,

//         paymentMethod:
//           paymentMethod ||
//           "Cash on Delivery",

//         status: "Pending",
//       });

//       await newOrder.save();

//       console.log(
//         "✅ Order saved successfully to DB with ID:",
//         newOrder._id
//       );

//       console.log(
//         "📍 CUSTOMER LOCATION SAVED:",
//         newOrder.deliveryLocation
//       );

//       res.status(201).json({
//         message:
//           "Order placed successfully!",

//         order: newOrder,
//       });
//     } catch (error) {
//       console.error(
//         "🔥🔥🔥 BACKEND ORDER CRASHED:",
//         error
//       );

//       res.status(500).json({
//         error:
//           "Internal server error. Please try again later.",
//       });
//     }
//   }
// );


// // =====================================================
// // DECODE GOOGLE ENCODED POLYLINE
// // =====================================================

// function decodePolyline(encoded) {
//   let index = 0;
//   let lat = 0;
//   let lng = 0;

//   const points = [];

//   while (index < encoded.length) {
//     let b;
//     let shift = 0;
//     let result = 0;

//     do {
//       b = encoded.charCodeAt(index++) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);

//     const dlat =
//       result & 1
//         ? ~(result >> 1)
//         : result >> 1;

//     lat += dlat;

//     shift = 0;
//     result = 0;

//     do {
//       b = encoded.charCodeAt(index++) - 63;
//       result |= (b & 0x1f) << shift;
//       shift += 5;
//     } while (b >= 0x20);

//     const dlng =
//       result & 1
//         ? ~(result >> 1)
//         : result >> 1;

//     lng += dlng;

//     points.push({
//       latitude: lat / 100000,
//       longitude: lng / 100000,
//     });
//   }

//   return points;
// }

// // =====================================================
// // GET USER ORDERS
// // =====================================================

// router.get(
//   "/my-orders",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const orders = await Order.find({
//         customerId: req.user.id,

//         hiddenFromHistory: {
//           $ne: true,
//         },
//       }).sort({
//         createdAt: -1,
//       });

//       res.json(orders);
//     } catch (error) {
//       console.error(
//         "Error fetching orders:",
//         error
//       );

//       res.status(500).json({
//         error:
//           "Failed to fetch orders.",
//       });
//     }
//   }
// );

// // =====================================================
// // TRACK ACTIVE ORDER
// // =====================================================
// //
// // GET:
// // /api/orders/:orderId/track
// //
// // Customer can only track their own order.
// //
// // =====================================================

// router.get(
//   "/:orderId/track",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { orderId } = req.params;

//       console.log(
//         "📍 TRACK ORDER REQUEST:",
//         orderId
//       );

//       // -----------------------------------------------
//       // VALIDATE ORDER ID
//       // -----------------------------------------------

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           orderId
//         )
//       ) {
//         return res.status(400).json({
//           error:
//             "Invalid order ID.",
//         });
//       }

//       // -----------------------------------------------
//       // FIND CUSTOMER'S ORDER
//       // -----------------------------------------------

//       const order = await Order.findOne({
//         _id: orderId,
//         customerId: req.user.id,
//       })
//         .populate(
//           "deliveryPartnerId",
//           "name phone vehicleType"
//         )
//         .populate(
//           "restaurantId",
//           "restaurantName address phone latitude longitude"
//         );

//       // -----------------------------------------------
//       // ORDER NOT FOUND
//       // -----------------------------------------------

//       if (!order) {
//         return res.status(404).json({
//           error:
//             "Order not found.",
//         });
//       }

//       console.log(
//   "🗄️ ORDER DELIVERY ADDRESS:",
//   order.deliveryAddress
// );

// console.log(
//   "🗄️ ORDER DELIVERY LOCATION:",
//   order.deliveryLocation
// );

//       // -----------------------------------------------
//       // DELIVERY PARTNER DATA
//       // -----------------------------------------------

//       let deliveryPartner = null;

//       if (order.deliveryPartnerId) {
//         deliveryPartner = {
//           id: order.deliveryPartnerId._id,

//           name:
//             order.deliveryPartnerId.name,

//           phone:
//             order.deliveryPartnerId.phone,

//           vehicleType:
//             order.deliveryPartnerId
//               .vehicleType,
//         };
//       }

//       // -----------------------------------------------
//       // LATEST DELIVERY PARTNER LOCATION
//       // -----------------------------------------------

//       let deliveryPartnerLocation = null;

//       // First priority:
//       // Location saved directly on Order
//       if (
//         order.deliveryPartnerLocation &&
//         typeof order.deliveryPartnerLocation
//           .latitude === "number" &&
//         typeof order.deliveryPartnerLocation
//           .longitude === "number"
//       ) {
//         deliveryPartnerLocation = {
//           latitude:
//             order.deliveryPartnerLocation
//               .latitude,

//           longitude:
//             order.deliveryPartnerLocation
//               .longitude,

//           updatedAt:
//             order.deliveryPartnerLocation
//               .updatedAt,
//         };
//       }

//       // -----------------------------------------------
//       // FALLBACK TO DELIVERY PARTNER LOCATION
//       // -----------------------------------------------

//       if (
//         !deliveryPartnerLocation &&
//         order.deliveryPartnerId
//       ) {
//         const partner =
//           await DeliveryPartner.findById(
//             order.deliveryPartnerId._id
//           ).select(
//             "currentLocation"
//           );

//         if (
//           partner &&
//           partner.currentLocation &&
//           Array.isArray(
//             partner.currentLocation
//               .coordinates
//           ) &&
//           partner.currentLocation
//             .coordinates.length === 2
//         ) {
//           const [
//             longitude,
//             latitude,
//           ] =
//             partner.currentLocation
//               .coordinates;

//           // Ignore default [0, 0]
//           if (
//             longitude !== 0 ||
//             latitude !== 0
//           ) {
//             deliveryPartnerLocation = {
//               latitude,
//               longitude,
//               updatedAt: null,
//             };
//           }
//         }
//       }

//       // -----------------------------------------------
//       // CUSTOMER LOCATION
//       // -----------------------------------------------

//       let customerLocation = null;

//       if (
//         order.deliveryLocation &&
//         typeof order.deliveryLocation
//           .latitude === "number" &&
//         typeof order.deliveryLocation
//           .longitude === "number"
//       ) {
//         customerLocation = {
//           latitude:
//             order.deliveryLocation.latitude,

//           longitude:
//             order.deliveryLocation.longitude,
//         };
//       }

//       // -----------------------------------------------
//       // RESTAURANT LOCATION
//       // -----------------------------------------------

//       let restaurantLocation = null;

//       if (
//         order.restaurantId &&
//         typeof order.restaurantId.latitude ===
//           "number" &&
//         typeof order.restaurantId.longitude ===
//           "number"
//       ) {
//         restaurantLocation = {
//           latitude:
//             order.restaurantId.latitude,

//           longitude:
//             order.restaurantId.longitude,
//         };
//       }

//       // -----------------------------------------------
//       // RESPONSE
//       // -----------------------------------------------

//       res.json({
//         success: true,

//         // ---------------------------------------------
//         // ORDER
//         // ---------------------------------------------

//         order: {
//           id: order._id,

//           status: order.status,

//           customerName:
//             order.customerName,

//           customerPhone:
//             order.customerPhone,

//           deliveryAddress:
//             order.deliveryAddress,

//           items:
//             order.items,

//           totalAmount:
//             order.totalAmount,

//           paymentMethod:
//             order.paymentMethod,

//           paymentStatus:
//             order.paymentStatus,

//           deliveryOtp:
//             order.deliveryOtp,

//           createdAt:
//             order.createdAt,

//           updatedAt:
//             order.updatedAt,
//         },

//         // ---------------------------------------------
//         // RESTAURANT
//         // ---------------------------------------------

//         restaurant:
//           order.restaurantId
//             ? {
//                 id:
//                   order.restaurantId._id,

//                 name:
//                   order.restaurantId
//                     .restaurantName,

//                 address:
//                   order.restaurantId.address,

//                 phone:
//                   order.restaurantId.phone,

//                 latitude:
//                   order.restaurantId.latitude,

//                 longitude:
//                   order.restaurantId.longitude,
//               }
//             : null,

//         // ---------------------------------------------
//         // CUSTOMER LOCATION
//         // ---------------------------------------------

//         customerLocation,

//         // ---------------------------------------------
//         // RESTAURANT LOCATION
//         // ---------------------------------------------

//         restaurantLocation,

//         // ---------------------------------------------
//         // DELIVERY PARTNER
//         // ---------------------------------------------

//         deliveryPartner,

//         // ---------------------------------------------
//         // DELIVERY PARTNER LOCATION
//         // ---------------------------------------------

//         deliveryPartnerLocation,
//       });
//     } catch (error) {
//       console.error(
//         "🔥 TRACK ORDER ERROR:",
//         error
//       );

//       res.status(500).json({
//         error:
//           "Failed to fetch tracking information.",
//       });
//     }
//   }
// );
     
// // =====================================================
// // GET LIVE DELIVERY ROUTE
// // =====================================================
// //
// // PICKUP PHASE:
// // Delivery Partner → Restaurant
// //
// // DELIVERY PHASE:
// // Delivery Partner → Customer
// //
// // Works for:
// // Customer + Assigned Delivery Partner
// //
// // =====================================================

// router.get(
//   "/:orderId/route",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { orderId } = req.params;

//       console.log("🛣️ ROUTE REQUEST:", orderId);
//       console.log("👤 ROUTE USER:", req.user?.id);

//       // -------------------------------------------------
//       // VALIDATE ORDER ID
//       // -------------------------------------------------

//       if (!mongoose.Types.ObjectId.isValid(orderId)) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid order ID.",
//         });
//       }

//       // -------------------------------------------------
//       // FIND ORDER
//       // -------------------------------------------------

//       const order = await Order.findById(orderId)
//         .populate(
//           "restaurantId",
//           "restaurantName address phone latitude longitude"
//         )
//         .populate(
//           "deliveryPartnerId",
//           "name phone vehicleType"
//         );

//       if (!order) {
//         return res.status(404).json({
//           success: false,
//           error: "Order not found.",
//         });
//       }

//       // -------------------------------------------------
//       // AUTHORIZATION
//       // Customer OR Assigned Delivery Partner
//       // -------------------------------------------------

//       const isCustomer =
//         String(order.customerId) === String(req.user.id);

//       const isAssignedDeliveryPartner =
//         order.deliveryPartnerId &&
//         String(order.deliveryPartnerId._id) ===
//           String(req.user.id);

//       if (
//         !isCustomer &&
//         !isAssignedDeliveryPartner
//       ) {
//         return res.status(403).json({
//           success: false,
//           error:
//             "You are not authorized to view this route.",
//         });
//       }

//       // -------------------------------------------------
//       // DELIVERY PARTNER LIVE LOCATION
//       // -------------------------------------------------

//       let deliveryPartnerLocation = null;

//       // First priority:
//       // Location stored directly on Order

//       if (
//         order.deliveryPartnerLocation &&
//         typeof order.deliveryPartnerLocation.latitude ===
//           "number" &&
//         typeof order.deliveryPartnerLocation.longitude ===
//           "number"
//       ) {
//         deliveryPartnerLocation = {
//           latitude:
//             order.deliveryPartnerLocation.latitude,

//           longitude:
//             order.deliveryPartnerLocation.longitude,

//           updatedAt:
//             order.deliveryPartnerLocation.updatedAt ||
//             null,
//         };
//       }

//       // -------------------------------------------------
//       // FALLBACK:
//       // Get latest location from DeliveryPartner
//       // -------------------------------------------------

//       if (
//         !deliveryPartnerLocation &&
//         order.deliveryPartnerId
//       ) {
//         const partner =
//           await DeliveryPartner.findById(
//             order.deliveryPartnerId._id
//           ).select("currentLocation");

//         if (
//           partner &&
//           partner.currentLocation &&
//           Array.isArray(
//             partner.currentLocation.coordinates
//           ) &&
//           partner.currentLocation.coordinates.length === 2
//         ) {
//           const [
//             longitude,
//             latitude,
//           ] =
//             partner.currentLocation.coordinates;

//           if (
//             Number.isFinite(latitude) &&
//             Number.isFinite(longitude) &&
//             latitude !== 0 &&
//             longitude !== 0
//           ) {
//             deliveryPartnerLocation = {
//               latitude,
//               longitude,
//               updatedAt: null,
//             };
//           }
//         }
//       }

//       // -------------------------------------------------
//       // CHECK DELIVERY PARTNER LOCATION
//       // -------------------------------------------------

//       if (!deliveryPartnerLocation) {
//         return res.status(400).json({
//           success: false,
//           error:
//             "Delivery partner live location is not available yet.",
//         });
//       }

//       // -------------------------------------------------
//       // RESTAURANT LOCATION
//       // -------------------------------------------------

//       let restaurantLocation = null;

//       if (
//         order.restaurantId &&
//         typeof order.restaurantId.latitude ===
//           "number" &&
//         typeof order.restaurantId.longitude ===
//           "number"
//       ) {
//         restaurantLocation = {
//           latitude:
//             order.restaurantId.latitude,

//           longitude:
//             order.restaurantId.longitude,
//         };
//       }

//   // =====================================================
// // CUSTOMER DELIVERY LOCATION
// // =====================================================

// // Priority:
// // 1. Fixed delivery location saved with the order
// // 2. Live customer location
// let customerLocation = null;

// if (
//   order.deliveryLocation &&
//   typeof order.deliveryLocation.latitude === "number" &&
//   typeof order.deliveryLocation.longitude === "number"
// ) {
//   customerLocation = {
//     latitude: order.deliveryLocation.latitude,
//     longitude: order.deliveryLocation.longitude,
//   };

//   console.log(
//     "📍 FIXED CUSTOMER DELIVERY LOCATION:",
//     customerLocation
//   );
// }

// // If fixed delivery location is unavailable,
// // use customer's latest live location.
// else if (
//   order.customerLocation &&
//   typeof order.customerLocation.latitude === "number" &&
//   typeof order.customerLocation.longitude === "number"
// ) {
//   customerLocation = {
//     latitude: order.customerLocation.latitude,
//     longitude: order.customerLocation.longitude,
//   };

//   console.log(
//     "📍 LIVE CUSTOMER LOCATION USED:",
//     customerLocation
//   );
// }

//       // -------------------------------------------------
//       // CHECK CUSTOMER LOCATION
//       // -------------------------------------------------

//       if (!customerLocation) {
//         return res.status(400).json({
//           success: false,
//           error:
//             "Customer delivery location is not available.",
//         });
//       }

//       // -------------------------------------------------
//       // DETERMINE TRACKING PHASE
//       // -------------------------------------------------
//       //
//       // Accepted by Delivery:
//       // Delivery Partner → Restaurant
//       //
//       // Out for Delivery:
//       // Delivery Partner → Customer
//       //
//       // Delivered:
//       // Delivery Partner → Customer
//       //
//       // -------------------------------------------------

//       const isPickupPhase =
//         order.status === "Pending" ||
//         order.status === "Preparing" ||
//         order.status === "Accepted by Delivery";

//       const isDeliveryPhase =
//         order.status === "Out for Delivery" ||
//         order.status === "Delivered";

//       let destination = null;
//       let trackingPhase = null;

//       // -------------------------------------------------
//       // PICKUP ROUTE
//       // -------------------------------------------------

//       if (isPickupPhase) {
//         if (!restaurantLocation) {
//           return res.status(400).json({
//             success: false,
//             error:
//               "Restaurant location is not available.",
//           });
//         }

//         destination = restaurantLocation;
//         trackingPhase = "PICKUP";

//         console.log(
//           "🏪 PICKUP ROUTE:",
//           deliveryPartnerLocation,
//           "→",
//           restaurantLocation
//         );
//       }

//       // -------------------------------------------------
//       // DELIVERY ROUTE
//       // -------------------------------------------------

//       else if (isDeliveryPhase) {
//         destination = customerLocation;
//         trackingPhase = "DELIVERY";

//         console.log(
//           "📍 DELIVERY ROUTE:",
//           deliveryPartnerLocation,
//           "→",
//           customerLocation
//         );
//       }

//       // -------------------------------------------------
//       // UNKNOWN STATUS
//       // -------------------------------------------------

//       else {
//         return res.status(400).json({
//           success: false,
//           error:
//             `Route is not available for order status: ${order.status}`,
//         });
//       }

//       // -------------------------------------------------
//       // GOOGLE ROUTES API KEY
//       // -------------------------------------------------

//       const googleApiKey =
//         process.env.GOOGLE_ROUTES_API_KEY;

//       if (!googleApiKey) {
//         console.error(
//           "❌ GOOGLE_ROUTES_API_KEY is missing"
//         );

//         return res.status(500).json({
//           success: false,
//           error:
//             "Google Routes API key is not configured.",
//         });
//       }

//       // -------------------------------------------------
//       // GOOGLE ROUTES API
//       // -------------------------------------------------

//       const googleResponse = await fetch(
//         "https://routes.googleapis.com/directions/v2:computeRoutes",
//         {
//           method: "POST",

//           headers: {
//             "Content-Type": "application/json",

//             "X-Goog-Api-Key":
//               googleApiKey,

//             "X-Goog-FieldMask":
//               "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
//           },

//           body: JSON.stringify({
//             origin: {
//               location: {
//                 latLng: {
//                   latitude:
//                     deliveryPartnerLocation.latitude,

//                   longitude:
//                     deliveryPartnerLocation.longitude,
//                 },
//               },
//             },

//             destination: {
//               location: {
//                 latLng: {
//                   latitude:
//                     destination.latitude,

//                   longitude:
//                     destination.longitude,
//                 },
//               },
//             },

//             travelMode: "DRIVE",

//             routingPreference:
//               "TRAFFIC_AWARE",

//             polylineQuality:
//               "HIGH_QUALITY",

//             polylineEncoding:
//               "ENCODED_POLYLINE",
//           }),
//         }
//       );

//       // -------------------------------------------------
//       // GOOGLE API ERROR
//       // -------------------------------------------------

//       if (!googleResponse.ok) {
//         const errorText =
//           await googleResponse.text();

//         console.error(
//           "❌ GOOGLE ROUTES API ERROR:",
//           errorText
//         );

//         return res.status(
//           googleResponse.status
//         ).json({
//           success: false,
//           error:
//             "Google Routes API request failed.",
//         });
//       }

//       // -------------------------------------------------
//       // GOOGLE RESPONSE
//       // -------------------------------------------------
// const googleData =
//   await googleResponse.json();

// const route =
//   googleData?.routes?.[0];

// if (!route) {
//   return res.status(404).json({
//     success: false,
//     error:
//       "No route found.",
//   });
// }

// // -------------------------------------------------
// // DECODE ROUTE POLYLINE
// // -------------------------------------------------

// const encodedPolyline =
//   route.polyline?.encodedPolyline || "";

// const routeCoordinates =
//   encodedPolyline
//     ? decodePolyline(encodedPolyline)
//     : [];

// console.log(
//   "🛣️ ROUTE POINTS:",
//   routeCoordinates.length
// );

//       // -------------------------------------------------
//       // FINAL RESPONSE
//       // -------------------------------------------------

//       console.log(
//         "✅ ROUTE CREATED:",
//         trackingPhase,
//         "distance:",
//         route.distanceMeters,
//         "duration:",
//         route.duration
//       );

//       return res.json({
//         success: true,

//         orderId,

//         trackingPhase,

//         orderStatus:
//           order.status,

//         // 🛵 Live delivery partner
//         origin:
//           deliveryPartnerLocation,

//         // 🏪 Restaurant
//         restaurant:
//           restaurantLocation,

//         // 📍 Customer
//         customer:
//           customerLocation,

//         // Current destination
//         destination,

//         distanceMeters:
//           route.distanceMeters || 0,

//         duration:
//           route.duration || null,

//         encodedPolyline:
//           route.polyline
//             ?.encodedPolyline || null,

//             routeCoordinates,
//       });
//     } catch (error) {
//       console.error(
//         "🔥 ROUTE ENDPOINT ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         error:
//           "Failed to calculate delivery route.",
//       });
//     }
//   }
// );

// // =====================================================
// // GOOGLE REVERSE GEOCODING
// // =====================================================

// router.get(
//   "/reverse-geocode",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { lat, lng } = req.query;

//       if (!lat || !lng) {
//         return res.status(400).json({
//           success: false,
//           error: "Latitude and longitude are required.",
//         });
//       }

//       const latitude = Number(lat);
//       const longitude = Number(lng);

//       if (
//         !Number.isFinite(latitude) ||
//         !Number.isFinite(longitude)
//       ) {
//         return res.status(400).json({
//           success: false,
//           error: "Invalid latitude or longitude.",
//         });
//       }

//       // -------------------------------------------------
//       // GOOGLE API KEY
//       // -------------------------------------------------

//       const googleApiKey =
//         process.env.GOOGLE_ROUTES_API_KEY;

//       if (!googleApiKey) {
//         console.error(
//           "❌ GOOGLE_ROUTES_API_KEY is missing"
//         );

//         return res.status(500).json({
//           success: false,
//           error:
//             "Google API key is not configured.",
//         });
//       }

//       // -------------------------------------------------
//       // GOOGLE GEOCODING API
//       // -------------------------------------------------

//       const googleResponse = await fetch(
//         `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
//       );

//       const googleData =
//         await googleResponse.json();

//       if (
//         !googleResponse.ok ||
//         googleData.status !== "OK" ||
//         !googleData.results?.length
//       ) {
//         console.error(
//           "❌ GOOGLE GEOCODING ERROR:",
//           googleData
//         );

//         return res.status(404).json({
//           success: false,
//           error: "Google address not found.",
//           googleStatus:
//             googleData.status || null,
//         });
//       }

//       const result =
//         googleData.results[0];

//       console.log(
//         "📍 GOOGLE ADDRESS:",
//         result.formatted_address
//       );

//       return res.json({
//         success: true,

//         latitude,

//         longitude,

//         address:
//           result.formatted_address,

//         placeId:
//           result.place_id || null,

//         addressComponents:
//           result.address_components || [],
//       });
//     } catch (error) {
//       console.error(
//         "🔥 REVERSE GEOCODE ERROR:",
//         error
//       );

//       return res.status(500).json({
//         success: false,
//         error:
//           "Failed to get Google address.",
//       });
//     }
//   }
// );






// // =====================================================
// // REMOVE ORDER FROM HISTORY
// // =====================================================

// router.delete(
//   "/:orderId/history",
//   authMiddleware,
//   async (req, res) => {
//     try {
//       const { orderId } = req.params;

//       // -----------------------------------------------
//       // VALIDATE ORDER ID
//       // -----------------------------------------------

//       if (
//         !mongoose.Types.ObjectId.isValid(
//           orderId
//         )
//       ) {
//         return res.status(400).json({
//           error:
//             "Invalid order ID.",
//         });
//       }

//       // -----------------------------------------------
//       // FIND USER'S ORDER
//       // -----------------------------------------------

//     const order = await Order.findById(orderId);

// if (!order) {
//   return res.status(404).json({
//     success: false,
//     error: "Order not found.",
//   });
// }

// const isCustomer =
//   String(order.customerId) === String(req.user.id);

// const isAssignedDeliveryPartner =
//   order.deliveryPartnerId &&
//   String(order.deliveryPartnerId) === String(req.user.id);

// if (!isCustomer && !isAssignedDeliveryPartner) {
//   return res.status(403).json({
//     success: false,
//     error: "You are not authorized to view this route.",
//   });
// }

//       if (!order) {
//         return res.status(404).json({
//           error:
//             "Order not found.",
//         });
//       }

//       // -----------------------------------------------
//       // HIDE FROM HISTORY
//       // -----------------------------------------------

//       order.hiddenFromHistory = true;

//       await order.save();

//       res.json({
//         message:
//           "Order removed from your history.",
//       });
//     } catch (error) {
//       console.error(
//         "REMOVE ORDER FROM HISTORY ERROR:",
//         error
//       );

//       res.status(500).json({
//         error:
//           "Failed to remove order from history.",
//       });
//     }
//   }
// );

// export default router;


import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import Razorpay from "razorpay";

import Order from "../models/Order.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// =====================================================
// INITIALIZE RAZORPAY
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// HELPER: VALID COORDINATES
// =====================================================

function isValidCoordinate(location) {
  return (
    location &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude)) &&
    Number(location.latitude) !== 0 &&
    Number(location.longitude) !== 0
  );
}

// =====================================================
// HELPER: DECODE GOOGLE ENCODED POLYLINE
// =====================================================

function decodePolyline(encoded) {
  let index = 0;
  let lat = 0;
  let lng = 0;

  const points = [];

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng =
      result & 1
        ? ~(result >> 1)
        : result >> 1;

    lng += dlng;

    points.push({
      latitude: lat / 100000,
      longitude: lng / 100000,
    });
  }

  return points;
}

// =====================================================
// HELPER: GEOCODE ADDRESS
// =====================================================

async function geocodeAddress(address) {
  try {
    if (!address || !String(address).trim()) {
      console.warn(
        "⚠️ GEOCODE: Address is empty"
      );

      return null;
    }

    const googleApiKey =
      process.env.GOOGLE_ROUTES_API_KEY;

    if (!googleApiKey) {
      console.error(
        "❌ GOOGLE_ROUTES_API_KEY is missing"
      );

      return null;
    }

    console.log(
      "🌍 GEOCODING CUSTOMER ADDRESS:",
      address
    );

    const url =
      `https://maps.googleapis.com/maps/api/geocode/json` +
      `?address=${encodeURIComponent(address)}` +
      `&key=${googleApiKey}`;

    const response = await fetch(url);

    const data = await response.json();

    if (
      !response.ok ||
      data.status !== "OK" ||
      !data.results?.length
    ) {
      console.error(
        "❌ ADDRESS GEOCODING FAILED:",
        data
      );

      return null;
    }

    const location =
      data.results[0]?.geometry?.location;

    if (
      !location ||
      !Number.isFinite(location.lat) ||
      !Number.isFinite(location.lng)
    ) {
      console.error(
        "❌ GEOCODE RESPONSE HAS NO VALID LOCATION"
      );

      return null;
    }

    const result = {
      latitude: location.lat,
      longitude: location.lng,
    };

    console.log(
      "✅ CUSTOMER ADDRESS GEOCODED:",
      result
    );

    console.log(
      "📍 GOOGLE MATCHED ADDRESS:",
      data.results[0]?.formatted_address
    );

    return result;
  } catch (error) {
    console.error(
      "🔥 ADDRESS GEOCODING ERROR:",
      error
    );

    return null;
  }
}

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
  "/create-razorpay-order",
  authMiddleware,
  async (req, res) => {
    try {
      const { amount } = req.body;

      const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const order =
        await razorpay.orders.create(options);

      res.json(order);
    } catch (error) {
      console.error(
        "🔥🔥🔥 RAZORPAY ORDER ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to create payment order.",
      });
    }
  }
);

// =====================================================
// PLACE AN ORDER
// =====================================================

router.post(
  "/create",
  authMiddleware,
  async (req, res) => {
    try {
      console.log(
        "🔍 ORDER DATA RECEIVED:",
        req.body
      );

      console.log(
        "🔍 USER DATA:",
        req.user
      );

      const {
        restaurantId,
        items,
        totalAmount,
        deliveryAddress,
        deliveryLocation,
        paymentMethod,
      } = req.body;

      console.log(
        "📍 DELIVERY LOCATION RECEIVED IN BACKEND:",
        deliveryLocation
      );

      console.log(
        "📍 DELIVERY ADDRESS RECEIVED:",
        deliveryAddress
      );

      // -------------------------------------------------
      // VALIDATE RESTAURANT ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          restaurantId
        )
      ) {
        console.warn(
          "⚠️ Invalid restaurantId received:",
          restaurantId
        );

        return res.status(400).json({
          error:
            "Invalid or missing restaurant ID. Please refresh your cart and try again.",
        });
      }

      // -------------------------------------------------
      // VALIDATE ORDER DETAILS
      // -------------------------------------------------

      if (
        !items ||
        items.length === 0 ||
        !deliveryAddress
      ) {
        return res.status(400).json({
          error:
            "Missing required order details.",
        });
      }

      // -------------------------------------------------
      // CUSTOMER PHONE
      // -------------------------------------------------

      const customerPhone =
        req.user && req.user.phone
          ? req.user.phone
          : "0000000000";

      // -------------------------------------------------
      // NORMALIZE DELIVERY LOCATION
      // -------------------------------------------------

      let normalizedDeliveryLocation = {
        latitude: null,
        longitude: null,
      };

      if (
        deliveryLocation &&
        Number.isFinite(
          Number(deliveryLocation.latitude)
        ) &&
        Number.isFinite(
          Number(deliveryLocation.longitude)
        )
      ) {
        normalizedDeliveryLocation = {
          latitude: Number(
            deliveryLocation.latitude
          ),

          longitude: Number(
            deliveryLocation.longitude
          ),
        };
      }

      console.log(
        "📍 NORMALIZED DELIVERY LOCATION:",
        normalizedDeliveryLocation
      );

      // -------------------------------------------------
      // CREATE ORDER
      // -------------------------------------------------

      const newOrder = new Order({
        restaurantId:
          new mongoose.Types.ObjectId(
            restaurantId
          ),

        customerId:
          req.user.id,

        customerName:
          req.user.name,

        customerPhone:
          customerPhone,

        deliveryAddress,

        deliveryLocation:
          normalizedDeliveryLocation,

        items,

        totalAmount,

        paymentMethod:
          paymentMethod ||
          "Cash on Delivery",

        status: "Pending",
      });

      await newOrder.save();

      console.log(
        "✅ Order saved successfully to DB with ID:",
        newOrder._id
      );

      console.log(
        "📍 CUSTOMER LOCATION SAVED:",
        newOrder.deliveryLocation
      );

      res.status(201).json({
        message:
          "Order placed successfully!",

        order: newOrder,
      });
    } catch (error) {
      console.error(
        "🔥🔥🔥 BACKEND ORDER CRASHED:",
        error
      );

      res.status(500).json({
        error:
          "Internal server error. Please try again later.",
      });
    }
  }
);

// =====================================================
// GET USER ORDERS
// =====================================================

router.get(
  "/my-orders",
  authMiddleware,
  async (req, res) => {
    try {
      const orders = await Order.find({
        customerId: req.user.id,

        hiddenFromHistory: {
          $ne: true,
        },
      }).sort({
        createdAt: -1,
      });

      res.json(orders);
    } catch (error) {
      console.error(
        "Error fetching orders:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch orders.",
      });
    }
  }
);

// =====================================================
// TRACK ACTIVE ORDER
// =====================================================

router.get(
  "/:orderId/track",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      console.log(
        "📍 TRACK ORDER REQUEST:",
        orderId
      );

      // -------------------------------------------------
      // VALIDATE ORDER ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid order ID.",
        });
      }

      // -------------------------------------------------
      // FIND CUSTOMER ORDER
      // -------------------------------------------------

      const order =
        await Order.findOne({
          _id: orderId,
          customerId: req.user.id,
        })
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          )
          .populate(
            "restaurantId",
            "restaurantName address phone latitude longitude"
          );

      if (!order) {
        return res.status(404).json({
          error:
            "Order not found.",
        });
      }

      console.log(
        "🗄️ ORDER DELIVERY ADDRESS:",
        order.deliveryAddress
      );

      console.log(
        "🗄️ ORDER DELIVERY LOCATION:",
        order.deliveryLocation
      );

      // -------------------------------------------------
      // DELIVERY PARTNER DATA
      // -------------------------------------------------

      let deliveryPartner = null;

      if (order.deliveryPartnerId) {
        deliveryPartner = {
          id:
            order.deliveryPartnerId._id,

          name:
            order.deliveryPartnerId.name,

          phone:
            order.deliveryPartnerId.phone,

          vehicleType:
            order.deliveryPartnerId.vehicleType,
        };
      }

      // -------------------------------------------------
      // DELIVERY PARTNER LOCATION
      // -------------------------------------------------

      let deliveryPartnerLocation = null;

      if (
        isValidCoordinate(
          order.deliveryPartnerLocation
        )
      ) {
        deliveryPartnerLocation = {
          latitude:
            Number(
              order.deliveryPartnerLocation
                .latitude
            ),

          longitude:
            Number(
              order.deliveryPartnerLocation
                .longitude
            ),

          updatedAt:
            order.deliveryPartnerLocation
              .updatedAt,
        };
      }

      // -------------------------------------------------
      // FALLBACK TO DELIVERY PARTNER LOCATION
      // -------------------------------------------------

      if (
        !deliveryPartnerLocation &&
        order.deliveryPartnerId
      ) {
        const partner =
          await DeliveryPartner.findById(
            order.deliveryPartnerId._id
          ).select(
            "currentLocation"
          );

        if (
          partner &&
          partner.currentLocation &&
          Array.isArray(
            partner.currentLocation.coordinates
          ) &&
          partner.currentLocation.coordinates
            .length === 2
        ) {
          const [
            longitude,
            latitude,
          ] =
            partner.currentLocation
              .coordinates;

          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude !== 0 &&
            longitude !== 0
          ) {
            deliveryPartnerLocation = {
              latitude,
              longitude,
              updatedAt: null,
            };
          }
        }
      }

      // -------------------------------------------------
      // CUSTOMER LOCATION
      // -------------------------------------------------

      let customerLocation = null;

      if (
        isValidCoordinate(
          order.deliveryLocation
        )
      ) {
        customerLocation = {
          latitude:
            Number(
              order.deliveryLocation.latitude
            ),

          longitude:
            Number(
              order.deliveryLocation.longitude
            ),
        };
      }

      // -------------------------------------------------
      // RESTAURANT LOCATION
      // -------------------------------------------------

      let restaurantLocation = null;

      if (
        order.restaurantId &&
        Number.isFinite(
          Number(order.restaurantId.latitude)
        ) &&
        Number.isFinite(
          Number(order.restaurantId.longitude)
        ) &&
        Number(order.restaurantId.latitude) !==
          0 &&
        Number(order.restaurantId.longitude) !==
          0
      ) {
        restaurantLocation = {
          latitude:
            Number(
              order.restaurantId.latitude
            ),

          longitude:
            Number(
              order.restaurantId.longitude
            ),
        };
      }

      // -------------------------------------------------
      // RESPONSE
      // -------------------------------------------------


      // -------------------------------------------------
// DEBUG RESTAURANT LOCATION
// -------------------------------------------------

console.log(
  "🏪 RESTAURANT ID:",
  order.restaurantId?._id
);

console.log(
  "🏪 RESTAURANT NAME:",
  order.restaurantId?.restaurantName
);

console.log(
  "🏪 RESTAURANT LATITUDE:",
  order.restaurantId?.latitude
);

console.log(
  "🏪 RESTAURANT LONGITUDE:",
  order.restaurantId?.longitude
);

console.log(
  "📍 FINAL RESTAURANT LOCATION:",
  restaurantLocation
);

// -------------------------------------------------
// RESPONSE
// -------------------------------------------------

res.json({
  success: true,

  order: {
    id: order._id,

    status: order.status,

    customerName:
      order.customerName,

    customerPhone:
      order.customerPhone,

    deliveryAddress:
      order.deliveryAddress,

    items:
      order.items,

    totalAmount:
      order.totalAmount,

    paymentMethod:
      order.paymentMethod,

    paymentStatus:
      order.paymentStatus,

    deliveryOtp:
      order.deliveryOtp,

    createdAt:
      order.createdAt,

    updatedAt:
      order.updatedAt,
  },

  restaurant:
    order.restaurantId
      ? {
          id:
            order.restaurantId._id,

          name:
            order.restaurantId
              .restaurantName,

          address:
            order.restaurantId.address,

          phone:
            order.restaurantId.phone,

          latitude:
            order.restaurantId.latitude,

          longitude:
            order.restaurantId.longitude,
        }
      : null,

  customerLocation,

  restaurantLocation,

  deliveryPartner,

  deliveryPartnerLocation,
});

      res.json({
        success: true,

        order: {
          id: order._id,

          status: order.status,

          customerName:
            order.customerName,

          customerPhone:
            order.customerPhone,

          deliveryAddress:
            order.deliveryAddress,

          items:
            order.items,

          totalAmount:
            order.totalAmount,

          paymentMethod:
            order.paymentMethod,

          paymentStatus:
            order.paymentStatus,

          deliveryOtp:
            order.deliveryOtp,

          createdAt:
            order.createdAt,

          updatedAt:
            order.updatedAt,
        },

        restaurant:
          order.restaurantId
            ? {
                id:
                  order.restaurantId._id,

                name:
                  order.restaurantId
                    .restaurantName,

                address:
                  order.restaurantId.address,

                phone:
                  order.restaurantId.phone,

                latitude:
                  order.restaurantId.latitude,

                longitude:
                  order.restaurantId.longitude,
              }
            : null,

        customerLocation,

        restaurantLocation,

        deliveryPartner,

        deliveryPartnerLocation,
      });
    } catch (error) {
      console.error(
        "🔥 TRACK ORDER ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to fetch tracking information.",
      });
    }
  }
);

// =====================================================
// GET LIVE DELIVERY ROUTE
// =====================================================
//
// PICKUP:
// Delivery Partner → Restaurant
//
// DELIVERY:
// Delivery Partner → Customer
//
// =====================================================

router.get(
  "/:orderId/route",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      console.log("=================================");
      console.log(
        "🛣️ ROUTE REQUEST:",
        orderId
      );

      console.log(
        "👤 ROUTE USER:",
        req.user?.id
      );

      // -------------------------------------------------
      // VALIDATE ORDER ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid order ID.",
        });
      }

      // -------------------------------------------------
      // FIND ORDER
      // -------------------------------------------------

      const order =
        await Order.findById(orderId)
          .populate(
            "restaurantId",
            "restaurantName address phone latitude longitude"
          )
          .populate(
            "deliveryPartnerId",
            "name phone vehicleType"
          );

      if (!order) {
        return res.status(404).json({
          success: false,
          error:
            "Order not found.",
        });
      }

      console.log(
        "📦 ROUTE ORDER STATUS:",
        order.status
      );

      console.log(
        "📍 ROUTE ORDER DELIVERY LOCATION:",
        order.deliveryLocation
      );

      console.log(
        "📍 ROUTE ORDER CUSTOMER LOCATION:",
        order.customerLocation
      );

      console.log(
        "📍 ROUTE ORDER DELIVERY ADDRESS:",
        order.deliveryAddress
      );

      // -------------------------------------------------
      // AUTHORIZATION
      // -------------------------------------------------

      const isCustomer =
        String(order.customerId) ===
        String(req.user.id);

      const isAssignedDeliveryPartner =
        order.deliveryPartnerId &&
        String(
          order.deliveryPartnerId._id
        ) === String(req.user.id);

      if (
        !isCustomer &&
        !isAssignedDeliveryPartner
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You are not authorized to view this route.",
        });
      }

      // -------------------------------------------------
      // DELIVERY PARTNER LOCATION
      // -------------------------------------------------

      let deliveryPartnerLocation =
        null;

      // First priority:
      // Location stored on Order

      if (
        isValidCoordinate(
          order.deliveryPartnerLocation
        )
      ) {
        deliveryPartnerLocation = {
          latitude:
            Number(
              order.deliveryPartnerLocation
                .latitude
            ),

          longitude:
            Number(
              order.deliveryPartnerLocation
                .longitude
            ),

          updatedAt:
            order.deliveryPartnerLocation
              .updatedAt ||
            null,
        };
      }

      // -------------------------------------------------
      // FALLBACK TO DELIVERY PARTNER MODEL
      // -------------------------------------------------

      if (
        !deliveryPartnerLocation &&
        order.deliveryPartnerId
      ) {
        const partner =
          await DeliveryPartner.findById(
            order.deliveryPartnerId._id
          ).select(
            "currentLocation"
          );

        if (
          partner &&
          partner.currentLocation &&
          Array.isArray(
            partner.currentLocation.coordinates
          ) &&
          partner.currentLocation.coordinates
            .length === 2
        ) {
          const [
            longitude,
            latitude,
          ] =
            partner.currentLocation
              .coordinates;

          if (
            Number.isFinite(latitude) &&
            Number.isFinite(longitude) &&
            latitude !== 0 &&
            longitude !== 0
          ) {
            deliveryPartnerLocation = {
              latitude,
              longitude,
              updatedAt: null,
            };
          }
        }
      }

      // -------------------------------------------------
      // CHECK DELIVERY PARTNER LOCATION
      // -------------------------------------------------

      if (!deliveryPartnerLocation) {
        console.error(
          "❌ ROUTE STOPPED: DELIVERY PARTNER LOCATION NOT AVAILABLE"
        );

        return res.status(400).json({
          success: false,
          error:
            "Delivery partner live location is not available yet.",
        });
      }

      console.log(
        "✅ ROUTE DELIVERY PARTNER LOCATION AVAILABLE:",
        deliveryPartnerLocation
      );

      // -------------------------------------------------
      // RESTAURANT LOCATION
      // -------------------------------------------------

      let restaurantLocation = null;

      if (
        order.restaurantId &&
        Number.isFinite(
          Number(order.restaurantId.latitude)
        ) &&
        Number.isFinite(
          Number(order.restaurantId.longitude)
        ) &&
        Number(order.restaurantId.latitude) !==
          0 &&
        Number(order.restaurantId.longitude) !==
          0
      ) {
        restaurantLocation = {
          latitude:
            Number(
              order.restaurantId.latitude
            ),

          longitude:
            Number(
              order.restaurantId.longitude
            ),
        };
      }

      if (restaurantLocation) {
        console.log(
          "✅ ROUTE RESTAURANT LOCATION AVAILABLE:",
          restaurantLocation
        );
      } else {
        console.warn(
          "⚠️ ROUTE RESTAURANT LOCATION NOT AVAILABLE"
        );
      }

      // -------------------------------------------------
      // CUSTOMER LOCATION
      // -------------------------------------------------
      //
      // PRIORITY:
      //
      // 1. order.deliveryLocation
      // 2. order.customerLocation
      // 3. Geocode order.deliveryAddress
      //
      // -------------------------------------------------

      let customerLocation = null;

      // -------------------------------------------------
      // 1. FIXED DELIVERY LOCATION
      // -------------------------------------------------

      if (
        isValidCoordinate(
          order.deliveryLocation
        )
      ) {
        customerLocation = {
          latitude:
            Number(
              order.deliveryLocation.latitude
            ),

          longitude:
            Number(
              order.deliveryLocation.longitude
            ),
        };

        console.log(
          "✅ ROUTE CUSTOMER LOCATION FROM deliveryLocation:",
          customerLocation
        );
      }

      // -------------------------------------------------
      // 2. LIVE CUSTOMER LOCATION
      // -------------------------------------------------

      if (
        !customerLocation &&
        isValidCoordinate(
          order.customerLocation
        )
      ) {
        customerLocation = {
          latitude:
            Number(
              order.customerLocation.latitude
            ),

          longitude:
            Number(
              order.customerLocation.longitude
            ),
        };

        console.log(
          "✅ ROUTE CUSTOMER LOCATION FROM customerLocation:",
          customerLocation
        );
      }

      // -------------------------------------------------
      // 3. GEOCODE DELIVERY ADDRESS
      // -------------------------------------------------

      if (
        !customerLocation &&
        order.deliveryAddress
      ) {
        console.warn(
          "⚠️ CUSTOMER COORDINATES MISSING."
        );

        console.log(
          "🌍 FALLBACK: GEOCODING DELIVERY ADDRESS..."
        );

        customerLocation =
          await geocodeAddress(
            order.deliveryAddress
          );

        if (customerLocation) {
          console.log(
            "✅ ROUTE CUSTOMER LOCATION FROM ADDRESS:",
            customerLocation
          );

          // Save the resolved location back
          // to the order so future route requests
          // don't need to geocode again.

          order.deliveryLocation = {
            latitude:
              customerLocation.latitude,

            longitude:
              customerLocation.longitude,
          };

          await order.save();

          console.log(
            "💾 CUSTOMER LOCATION SAVED BACK TO ORDER"
          );
        }
      }

      // -------------------------------------------------
      // CHECK CUSTOMER LOCATION
      // -------------------------------------------------

      if (!customerLocation) {
        console.error(
          "❌ ROUTE STOPPED: CUSTOMER LOCATION NOT AVAILABLE"
        );

        return res.status(400).json({
          success: false,
          error:
            "Customer delivery location is not available. Please update the delivery address.",
        });
      }

      console.log(
        "🏠 ROUTE CUSTOMER LOCATION:",
        customerLocation
      );

      // -------------------------------------------------
      // DETERMINE TRACKING PHASE
      // -------------------------------------------------

      const isPickupPhase =
        order.status === "Pending" ||
        order.status === "Preparing" ||
        order.status ===
          "Accepted by Delivery";

      const isDeliveryPhase =
        order.status ===
          "Out for Delivery" ||
        order.status === "Delivered";

      let destination = null;
      let trackingPhase = null;

      // -------------------------------------------------
      // PICKUP ROUTE
      // -------------------------------------------------

      if (isPickupPhase) {
        if (!restaurantLocation) {
          return res.status(400).json({
            success: false,
            error:
              "Restaurant location is not available.",
          });
        }

        destination =
          restaurantLocation;

        trackingPhase = "PICKUP";

        console.log(
          "🏪 PICKUP ROUTE:",
          deliveryPartnerLocation,
          "→",
          restaurantLocation
        );
      }

      // -------------------------------------------------
      // DELIVERY ROUTE
      // -------------------------------------------------

      else if (isDeliveryPhase) {
        destination =
          customerLocation;

        trackingPhase = "DELIVERY";

        console.log(
          "📍 DELIVERY ROUTE:",
          deliveryPartnerLocation,
          "→",
          customerLocation
        );
      }

      // -------------------------------------------------
      // UNKNOWN STATUS
      // -------------------------------------------------

      else {
        return res.status(400).json({
          success: false,
          error:
            `Route is not available for order status: ${order.status}`,
        });
      }

      // -------------------------------------------------
      // GOOGLE ROUTES API KEY
      // -------------------------------------------------

      const googleApiKey =
        process.env.GOOGLE_ROUTES_API_KEY;

      if (!googleApiKey) {
        console.error(
          "❌ GOOGLE_ROUTES_API_KEY is missing"
        );

        return res.status(500).json({
          success: false,
          error:
            "Google Routes API key is not configured.",
        });
      }

      // -------------------------------------------------
      // GOOGLE ROUTES API
      // -------------------------------------------------

      console.log(
        "🌐 CALLING GOOGLE ROUTES API..."
      );

      console.log(
        "📍 ORIGIN:",
        deliveryPartnerLocation
      );

      console.log(
        "📍 DESTINATION:",
        destination
      );

      const googleResponse =
        await fetch(
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "X-Goog-Api-Key":
                googleApiKey,

              "X-Goog-FieldMask":
                "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
            },

            body: JSON.stringify({
              origin: {
                location: {
                  latLng: {
                    latitude:
                      deliveryPartnerLocation.latitude,

                    longitude:
                      deliveryPartnerLocation.longitude,
                  },
                },
              },

              destination: {
                location: {
                  latLng: {
                    latitude:
                      destination.latitude,

                    longitude:
                      destination.longitude,
                  },
                },
              },

              travelMode: "DRIVE",

              routingPreference:
                "TRAFFIC_AWARE",

              polylineQuality:
                "HIGH_QUALITY",

              polylineEncoding:
                "ENCODED_POLYLINE",
            }),
          }
        );

      // -------------------------------------------------
      // GOOGLE API ERROR
      // -------------------------------------------------

      if (!googleResponse.ok) {
        const errorText =
          await googleResponse.text();

        console.error(
          "❌ GOOGLE ROUTES API ERROR:",
          errorText
        );

        return res.status(
          googleResponse.status
        ).json({
          success: false,
          error:
            "Google Routes API request failed.",
        });
      }

      // -------------------------------------------------
      // GOOGLE RESPONSE
      // -------------------------------------------------

      const googleData =
        await googleResponse.json();

      const route =
        googleData?.routes?.[0];

      if (!route) {
        console.error(
          "❌ GOOGLE DID NOT RETURN A ROUTE:",
          googleData
        );

        return res.status(404).json({
          success: false,
          error:
            "No route found.",
        });
      }

      // -------------------------------------------------
      // DECODE ROUTE POLYLINE
      // -------------------------------------------------

      const encodedPolyline =
        route.polyline
          ?.encodedPolyline || "";

      const routeCoordinates =
        encodedPolyline
          ? decodePolyline(
              encodedPolyline
            )
          : [];

      console.log(
        "🛣️ ROUTE POINTS:",
        routeCoordinates.length
      );

      // -------------------------------------------------
      // FINAL RESPONSE
      // -------------------------------------------------

      console.log(
        "✅ ROUTE CREATED:",
        trackingPhase
      );

      console.log(
        "📏 DISTANCE:",
        route.distanceMeters
      );

      console.log(
        "⏱️ DURATION:",
        route.duration
      );

      return res.json({
        success: true,

        orderId,

        trackingPhase,

        orderStatus:
          order.status,

        // 🛵 Delivery partner
        origin:
          deliveryPartnerLocation,

        // 🏪 Restaurant
        restaurant:
          restaurantLocation,

        // 🏠 Customer
        customer:
          customerLocation,

        // 🎯 Current destination
        destination,

        distanceMeters:
          route.distanceMeters || 0,

        duration:
          route.duration || null,

        encodedPolyline:
          encodedPolyline || null,

        routeCoordinates,
      });
    } catch (error) {
      console.error(
        "🔥 ROUTE ENDPOINT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to calculate delivery route.",
      });
    }
  }
);

// =====================================================
// GOOGLE REVERSE GEOCODING
// =====================================================

router.get(
  "/reverse-geocode",
  authMiddleware,
  async (req, res) => {
    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error:
            "Latitude and longitude are required.",
        });
      }

      const latitude = Number(lat);
      const longitude = Number(lng);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return res.status(400).json({
          success: false,
          error:
            "Invalid latitude or longitude.",
        });
      }

      // -------------------------------------------------
      // GOOGLE API KEY
      // -------------------------------------------------

      const googleApiKey =
        process.env.GOOGLE_ROUTES_API_KEY;

      if (!googleApiKey) {
        console.error(
          "❌ GOOGLE_ROUTES_API_KEY is missing"
        );

        return res.status(500).json({
          success: false,
          error:
            "Google API key is not configured.",
        });
      }

      // -------------------------------------------------
      // GOOGLE GEOCODING API
      // -------------------------------------------------

      const googleResponse =
        await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
        );

      const googleData =
        await googleResponse.json();

      if (
        !googleResponse.ok ||
        googleData.status !== "OK" ||
        !googleData.results?.length
      ) {
        console.error(
          "❌ GOOGLE GEOCODING ERROR:",
          googleData
        );

        return res.status(404).json({
          success: false,
          error:
            "Google address not found.",

          googleStatus:
            googleData.status || null,
        });
      }

      const result =
        googleData.results[0];

      console.log(
        "📍 GOOGLE ADDRESS:",
        result.formatted_address
      );

      return res.json({
        success: true,

        latitude,

        longitude,

        address:
          result.formatted_address,

        placeId:
          result.place_id || null,

        addressComponents:
          result.address_components ||
          [],
      });
    } catch (error) {
      console.error(
        "🔥 REVERSE GEOCODE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        error:
          "Failed to get Google address.",
      });
    }
  }
);

// =====================================================
// REMOVE ORDER FROM HISTORY
// =====================================================

router.delete(
  "/:orderId/history",
  authMiddleware,
  async (req, res) => {
    try {
      const { orderId } = req.params;

      // -------------------------------------------------
      // VALIDATE ORDER ID
      // -------------------------------------------------

      if (
        !mongoose.Types.ObjectId.isValid(
          orderId
        )
      ) {
        return res.status(400).json({
          error:
            "Invalid order ID.",
        });
      }

      // -------------------------------------------------
      // FIND ORDER
      // -------------------------------------------------

      const order =
        await Order.findById(orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error:
            "Order not found.",
        });
      }

      // -------------------------------------------------
      // AUTHORIZATION
      // -------------------------------------------------

      const isCustomer =
        String(order.customerId) ===
        String(req.user.id);

      const isAssignedDeliveryPartner =
        order.deliveryPartnerId &&
        String(order.deliveryPartnerId) ===
          String(req.user.id);

      if (
        !isCustomer &&
        !isAssignedDeliveryPartner
      ) {
        return res.status(403).json({
          success: false,
          error:
            "You are not authorized to remove this order.",
        });
      }

      // -------------------------------------------------
      // HIDE FROM HISTORY
      // -------------------------------------------------

      order.hiddenFromHistory = true;

      await order.save();

      res.json({
        message:
          "Order removed from your history.",
      });
    } catch (error) {
      console.error(
        "REMOVE ORDER FROM HISTORY ERROR:",
        error
      );

      res.status(500).json({
        error:
          "Failed to remove order from history.",
      });
    }
  }
);

export default router;