import jwt from "jsonwebtoken";

const adminAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    console.log("=================================");
    console.log("ADMIN AUTH DEBUG");
    console.log("Authorization:", authHeader);
    console.log("=================================");

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer"
    ) {
      return res.status(401).json({
        success: false,
        message: "Malformed token format.",
      });
    }

    const token = parts[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Decoded admin token:", decoded);

    // Make sure this is actually an admin token
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    // Support both possible token structures
    const adminId =
      decoded.id ||
      decoded.adminId ||
      decoded._id;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    req.admin = {
      id: adminId,
      role: decoded.role,
      name: decoded.name || "",
    };

    console.log("ADMIN AUTH SUCCESS");
    console.log("Admin ID:", req.admin.id);
    console.log("Admin role:", req.admin.role);

    next();
  } catch (error) {
    console.error(
      "ADMIN AUTH ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired admin token. Please login again.",
    });
  }
};

export default adminAuthMiddleware;