import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import Order from "./models/Order.js";
import DeliveryPartner from "./models/DeliveryPartner.js";

let io = null;

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: false,
    },

  transports: ["polling", "websocket"],

    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ===================================================
  // SOCKET AUTHENTICATION
  // ===================================================

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        console.log(
          "❌ Socket auth failed: No token"
        );

        return next(
          new Error("Authentication required")
        );
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      socket.user = {
        id: decoded.id,
        name: decoded.name,
        role: decoded.role,
      };

      console.log(
        "✅ Socket authenticated:",
        socket.user.id,
        socket.user.role
      );

      next();
    } catch (error) {
      console.error(
        "❌ Socket authentication failed:",
        error.message
      );

      next(
        new Error(
          "Invalid or expired token"
        )
      );
    }
  });

  // ===================================================
  // CONNECTION
  // ===================================================

  io.on("connection", (socket) => {
    console.log(
      "🟢 Socket connected:",
      socket.id,
      "User:",
      socket.user?.id,
      "Role:",
      socket.user?.role
    );

    // =================================================
    // JOIN ORDER ROOM
    // =================================================

    socket.on(
      "joinOrder",
      async (orderId) => {
        try {
          if (!orderId) {
            console.log(
              "❌ joinOrder: orderId missing"
            );
            return;
          }

          const order =
            await Order.findById(orderId);

          if (!order) {
            console.log(
              "❌ joinOrder: Order not found:",
              orderId
            );

            return;
          }

          // -------------------------------------------
          // CUSTOMER
          // -------------------------------------------

          const isCustomer =
            String(order.customerId) ===
            String(socket.user.id);

          // -------------------------------------------
          // DELIVERY PARTNER
          // -------------------------------------------

          const isDeliveryPartner =
            order.deliveryPartnerId &&
            String(order.deliveryPartnerId) ===
              String(socket.user.id);

          // -------------------------------------------
          // AUTHORIZE
          // -------------------------------------------

          if (
            !isCustomer &&
            !isDeliveryPartner
          ) {
            console.log(
              "🚫 Unauthorized order room access:",
              {
                userId:
                  socket.user.id,
                role:
                  socket.user.role,
                orderId,
              }
            );

            return;
          }

          // -------------------------------------------
          // JOIN ROOM
          // -------------------------------------------

          const room =
            `order:${orderId}`;

          socket.join(room);

          console.log(
            `📦 Socket ${socket.id} joined ${room}`
          );

          console.log(
            "👤 Room member:",
            {
              userId:
                socket.user.id,
              role:
                socket.user.role,
              orderId,
            }
          );
        } catch (error) {
          console.error(
            "❌ joinOrder error:",
            error
          );
        }
      }
    );

    // =================================================
    // LEAVE ORDER ROOM
    // =================================================

    socket.on(
      "leaveOrder",
      (orderId) => {
        if (!orderId) {
          return;
        }

        const room =
          `order:${orderId}`;

        socket.leave(room);

        console.log(
          `📤 Socket ${socket.id} left ${room}`
        );
      }
    );

    // =================================================
    // DELIVERY PARTNER LOCATION
    // =================================================
    //
    // ONLY assigned delivery partner
    // can send delivery location.
    //
    // =================================================

    socket.on(
      "deliveryLocationUpdate",
      async (data) => {
console.log("🚨 DELIVERY LOCATION EVENT RECEIVED:", {
  socketId: socket.id,
  userId: socket.user?.id,
  role: socket.user?.role,
  data,
});

        try {
          const {
            orderId,
            latitude,
            longitude,
            updatedAt,
          } = data || {};

          // -------------------------------------------
          // VALIDATION
          // -------------------------------------------

          if (
            !orderId ||
            typeof latitude !==
              "number" ||
            typeof longitude !==
              "number"
          ) {
            console.log(
              "❌ Invalid delivery location:",
              data
            );

            return;
          }

          // -------------------------------------------
          // FIND ORDER
          // -------------------------------------------

          const order =
            await Order.findById(
              orderId
            );

          if (!order) {
            console.log(
              "❌ Delivery location: Order not found:",
              orderId
            );

            return;
          }

          // -------------------------------------------
          // VERIFY DELIVERY PARTNER
          // -------------------------------------------

          if (
            !order.deliveryPartnerId ||
            String(
              order.deliveryPartnerId
            ) !==
              String(socket.user.id)
          ) {
            console.log(
              "🚫 Unauthorized delivery location:",
              {
                userId:
                  socket.user.id,
                orderId,
              }
            );

            return;
          }

          // -------------------------------------------
          // SAVE LOCATION
          // -------------------------------------------

          const locationTime =
            updatedAt
              ? new Date(updatedAt)
              : new Date();

          order.deliveryPartnerLocation =
            {
              latitude,
              longitude,
              updatedAt:
                locationTime,
            };

          await order.save();

          // -------------------------------------------
          // BROADCAST
          // -------------------------------------------

          const room =
            `order:${orderId}`;

          io.to(room).emit(
            "deliveryLocationUpdate",
            {
              orderId,
              latitude,
              longitude,
              updatedAt:
                locationTime,
            }
          );

          console.log(
            "📍 Live delivery location:",
            {
              orderId,
              latitude,
              longitude,
            }
          );
        } catch (error) {
          console.error(
            "❌ Delivery location socket error:",
            error
          );
        }
      }
    );

    // =================================================
    // CUSTOMER LOCATION
    // =================================================
    //
    // ONLY order customer can send
    // customer location.
    //
    // =================================================

    socket.on(
      "customerLocationUpdate",
      async (data) => {
        try {
          const {
            orderId,
            latitude,
            longitude,
            updatedAt,
          } = data || {};

          // -------------------------------------------
          // VALIDATION
          // -------------------------------------------

          if (
            !orderId ||
            typeof latitude !==
              "number" ||
            typeof longitude !==
              "number"
          ) {
            console.log(
              "❌ Invalid customer location:",
              data
            );

            return;
          }

          // -------------------------------------------
          // FIND ORDER
          // -------------------------------------------

          const order =
            await Order.findById(
              orderId
            );

          if (!order) {
            console.log(
              "❌ Customer location: Order not found:",
              orderId
            );

            return;
          }

          // -------------------------------------------
          // VERIFY CUSTOMER
          // -------------------------------------------

          if (
            String(
              order.customerId
            ) !==
            String(socket.user.id)
          ) {
            console.log(
              "🚫 Unauthorized customer location:",
              {
                userId:
                  socket.user.id,
                orderId,
              }
            );

            return;
          }

          // -------------------------------------------
          // SAVE LOCATION
          // -------------------------------------------

          const locationTime =
            updatedAt
              ? new Date(updatedAt)
              : new Date();

          order.customerLocation =
            {
              latitude,
              longitude,
              updatedAt:
                locationTime,
            };

          await order.save();

          // -------------------------------------------
          // BROADCAST TO ORDER ROOM
          // -------------------------------------------

          const room =
            `order:${orderId}`;

          io.to(room).emit(
            "customerLocationUpdate",
            {
              orderId,
              latitude,
              longitude,
              updatedAt:
                locationTime,
            }
          );

          console.log(
            "👤 Live customer location:",
            {
              orderId,
              latitude,
              longitude,
            }
          );
        } catch (error) {
          console.error(
            "❌ Customer location socket error:",
            error
          );
        }
      }
    );

    // =================================================
    // SEND MESSAGE
    // =================================================

    socket.on(
      "sendMessage",
      async (data) => {
        try {
          const {
            orderId,
            message,
          } = data || {};

          if (
            !orderId ||
            !message ||
            !message.trim()
          ) {
            return;
          }

          const order =
            await Order.findById(
              orderId
            );

          if (!order) {
            console.log(
              "❌ Message: Order not found"
            );

            return;
          }

          // -------------------------------------------
          // CHECK CUSTOMER
          // -------------------------------------------

          const isCustomer =
            String(
              order.customerId
            ) ===
            String(socket.user.id);

          // -------------------------------------------
          // CHECK DELIVERY PARTNER
          // -------------------------------------------

          const isDeliveryPartner =
            order.deliveryPartnerId &&
            String(
              order.deliveryPartnerId
            ) ===
              String(socket.user.id);

          if (
            !isCustomer &&
            !isDeliveryPartner
          ) {
            console.log(
              "🚫 Unauthorized message attempt:",
              socket.user.id
            );

            return;
          }

          // -------------------------------------------
          // SENDER ROLE
          // -------------------------------------------

          const senderRole =
            isDeliveryPartner
              ? "delivery"
              : "customer";

          // -------------------------------------------
          // MESSAGE DATA
          // -------------------------------------------

          const messageData = {
            orderId,
            senderId:
              socket.user.id,
            senderName:
              socket.user.name ||
              "User",
            senderRole,
            message:
              message.trim(),
            createdAt:
              new Date(),
          };

          // -------------------------------------------
          // BROADCAST
          // -------------------------------------------

          const room =
            `order:${orderId}`;

          io.to(room).emit(
            "receiveMessage",
            messageData
          );

          console.log(
            "💬 Message sent:",
            messageData
          );
        } catch (error) {
          console.error(
            "❌ Socket message error:",
            error
          );
        }
      }
    );

    // =================================================
    // DISCONNECT
    // =================================================

    socket.on(
      "disconnect",
      (reason) => {
        console.log(
          "🔴 Socket disconnected:",
          socket.id,
          "Reason:",
          reason
        );
      }
    );
  });

  console.log(
    "🔌 Socket.IO initialized successfully"
  );

  return io;
};

// =====================================================
// GET SOCKET.IO INSTANCE
// =====================================================

export const getIO = () => {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized yet."
    );
  }

  return io;
};