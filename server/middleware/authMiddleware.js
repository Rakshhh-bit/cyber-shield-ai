const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // ❌ No token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // ❌ No secret
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT secret missing" });
    }

    // ✅ VERIFY TOKEN
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ IMPORTANT: MATCH YOUR LOGIN TOKEN STRUCTURE
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();

  } catch (err) {
    console.log("AUTH ERROR:", err.message);

    return res.status(401).json({
      error: "Invalid or expired token",
    });
  }
};