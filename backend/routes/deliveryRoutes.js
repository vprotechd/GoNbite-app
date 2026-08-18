import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import DeliveryPartner from '../models/DeliveryPartner.js';
import Order from '../models/Order.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// --- AUTH ---
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, vehicleType } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const partner = new DeliveryPartner({
      name, email, password: hashedPassword, phone, vehicleType
    });
    await partner.save();
    res.status(201).json({ message: "Delivery Partner registered! Please wait for Admin approval." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const partner = await DeliveryPartner.findOne({ email });
    if (!partner) return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, partner.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    // Block if not verified by Admin
    if (!partner.isVerified) {
      return res.status(403).json({ error: "Your account is pending admin verification." });
    }

    const token = jwt.sign({ id: partner._id, role: 'delivery' }, process.env.JWT_SECRET);
    res.json({ token, partner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PROFILE & KYC ---
router.get('/profile', authMiddleware, async (req, res) => {
  const partner = await DeliveryPartner.findById(req.user.id);
  res.json(partner);
});

router.put('/toggle-online', authMiddleware, async (req, res) => {
  const partner = await DeliveryPartner.findById(req.user.id);
  partner.isOnline = !partner.isOnline;
  await partner.save();
  res.json({ isOnline: partner.isOnline });
});

// --- AVAILABLE ORDERS (Pickup Requests) ---
router.get('/available-orders', authMiddleware, async (req, res) => {
  // Find orders that are "Preparing" or "Out for Delivery" but no partner assigned
  const orders = await Order.find({ 
    status: { $in: ["Preparing", "Out for Delivery"] },
    deliveryPartnerId: null 
  }).populate('restaurantId', 'restaurantName address');
  res.json(orders);
});

// --- ACCEPT / REJECT ORDER ---
router.put('/accept-order/:id', authMiddleware, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // Assign to this delivery partner
  order.deliveryPartnerId = req.user.id;
  order.status = "Out for Delivery";
  await order.save();

  // Update Partner stats
  const partner = await DeliveryPartner.findById(req.user.id);
  partner.currentOrderId = order._id;
  await partner.save();

  res.json({ message: "Order accepted!", order });
});

router.put('/reject-order/:id', authMiddleware, async (req, res) => {
  // Just mark that we won't take it (no DB change needed)
  res.json({ message: "Order rejected." });
});

// --- UPDATE DELIVERY STATUS & NAVIGATION ---
router.put('/update-status/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ error: "Order not found" });

  // Restrict status updates for delivery partner
  if (!["Out for Delivery", "Delivered"].includes(status)) {
    return res.status(400).json({ error: "Invalid status update." });
  }

  order.status = status;
  await order.save();

  // If Delivered, update earnings
  if (status === "Delivered") {
    const partner = await DeliveryPartner.findById(req.user.id);
    partner.totalDeliveries += 1;
    partner.totalEarnings += order.totalAmount * 0.1; // 10% delivery fee
    partner.walletBalance += order.totalAmount * 0.1;
    partner.currentOrderId = null; // Free up partner
    partner.isOnline = true; // Re-enable online status
    await partner.save();
  }

  res.json({ message: `Status updated to ${status}`, order });
});

// --- DASHBOARD & EARNINGS ---
router.get('/dashboard', authMiddleware, async (req, res) => {
  const partner = await DeliveryPartner.findById(req.user.id);
  const activeOrder = await Order.findOne({ 
    deliveryPartnerId: req.user.id, 
    status: { $ne: "Delivered" } 
  });

  res.json({
    walletBalance: partner.walletBalance,
    totalDeliveries: partner.totalDeliveries,
    totalEarnings: partner.totalEarnings,
    isOnline: partner.isOnline,
    activeOrder: activeOrder
  });
});

// --- DELIVERY HISTORY ---
router.get('/history', authMiddleware, async (req, res) => {
  const orders = await Order.find({ 
    deliveryPartnerId: req.user.id, 
    status: "Delivered" 
  }).sort({ createdAt: -1 });
  res.json(orders);
});


// ✅ UPDATE LIVE LOCATION
router.put('/update-location', authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const partner = await DeliveryPartner.findById(req.user.id);
    partner.currentLocation = {
      type: "Point",
      coordinates: [longitude, latitude]
    };
    await partner.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update location." });
  }
});

export default router;