import Razorpay from "razorpay";
import crypto from "crypto";

// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error("RAZORPAY_KEY_ID is missing");
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("RAZORPAY_KEY_SECRET is missing");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid amount is required",
      });
    }

    const razorpay = getRazorpay();

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt: `snax_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    console.log("Razorpay order created:", order.id);

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Razorpay Order Error:", error);

    return res.status(500).json({
      success: false,
      error:
        error?.error?.description ||
        error?.message ||
        "Failed to create Razorpay order",
    });
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        error: "Payment verification data is incomplete",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        success: false,
        error: "RAZORPAY_KEY_SECRET is missing",
      });
    }

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    const isValid =
      expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: "Invalid payment signature",
      });
    }

    console.log(
      "Razorpay payment verified:",
      razorpay_payment_id
    );

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (error) {
    console.error(
      "Razorpay Verification Error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error?.message ||
        "Payment verification failed",
    });
  }
};
