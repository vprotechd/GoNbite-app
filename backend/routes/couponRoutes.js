import express from 'express';
import Coupon from '../models/Coupon.js';

const router = express.Router();

// ✅ Verify a coupon code (Debug enabled)
router.post('/verify', async (req, res) => {
  try {
    const { code, totalAmount } = req.body;
    
    console.log("🔍 Backend received coupon request:", { code, totalAmount });

    // 1. Check if code exists in the request
    if (!code) {
      return res.status(400).json({ valid: false, message: "No coupon code provided." });
    }

    // 2. Find the coupon in database (uppercase)
    const coupon = await Coupon.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });

    // 3. Check if coupon exists
    if (!coupon) {
      console.log("❌ Coupon not found in DB for code:", code.toUpperCase());
      return res.status(400).json({ valid: false, message: `Coupon "${code}" does not exist.` });
    }

    console.log("✅ Found coupon in DB:", coupon);

    // 4. Check if coupon has expired
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ valid: false, message: "This coupon has expired." });
    }

    // 5. Check minimum order amount
    if (totalAmount < coupon.minOrderAmount) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon.` 
      });
    }

    // Valid Coupon!
    res.json({ 
      valid: true, 
      discountPercentage: coupon.discountPercentage,
      code: coupon.code,
      message: `Coupon applied! ${coupon.discountPercentage}% off.`
    });

  } catch (error) {
    console.error("🔥 Backend Coupon Error:", error);
    res.status(500).json({ error: "Server error processing coupon." });
  }
});

export default router;