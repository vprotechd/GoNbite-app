import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const adminMiddleware = async (req, res, next) => {
  try {
    // ==========================================
    // GET TOKEN
    // ==========================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: "Authentication required.",
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Invalid authorization format.",
      });
    }

    const token = authHeader.split(" ")[1];

    // ==========================================
    // VERIFY JWT
    // ==========================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // ==========================================
    // FIND ADMIN
    // ==========================================

    const admin = await Admin.findById(
      decoded.id
    ).select("-password");

    if (!admin) {
      return res.status(401).json({
        error: "Admin account not found.",
      });
    }

    // ==========================================
    // CHECK ACTIVE STATUS
    // ==========================================

    if (!admin.isActive) {
      return res.status(403).json({
        error: "Admin account is inactive.",
      });
    }

    // ==========================================
    // SAVE ADMIN IN REQUEST
    // ==========================================

    req.admin = admin;

    next();

  } catch (error) {
    console.error(
      "ADMIN AUTH ERROR:",
      error.message
    );

    return res.status(401).json({
      error: "Invalid or expired admin token.",
    });
  }
};

export default adminMiddleware;