import jwt from "jsonwebtoken";

const authMiddleware = (req, res, next) => {
  // 1. Get the token from the Authorization header
  const authHeader = req.header("Authorization");
  
  console.log("🔍 AUTH DEBUG: authHeader =", authHeader);

  if (!authHeader) {
    console.log("❌ AUTH FAILED: No Authorization header provided.");
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    // 2. Extract the token (Expecting "Bearer <token>")
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      console.log("❌ AUTH FAILED: Malformed Authorization header.");
      return res.status(401).json({ error: "Malformed token format." });
    }

    const token = parts[1];

    // 3. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log("✅ AUTH SUCCESS: Decoded ID =", decoded.id);
    console.log("✅ AUTH SUCCESS: Decoded Name =", decoded.name); // Should print the user's name

    // ✅ THE FINAL FIX: Attach to BOTH req.user (Customers) AND req.restaurant (Restaurants)
    // Also include the name for the Order route
    req.user = { 
      id: decoded.id, 
      name: decoded.name,   // 👈 CRITICAL: This fixes the 401!
      role: decoded.role 
    };
    req.restaurant = { id: decoded.id };
    
    // 5. Move to the next middleware/controller
    next();
  } catch (error) {
    console.error("❌ AUTH FAILED: Token verification error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
  }
};

export default authMiddleware;