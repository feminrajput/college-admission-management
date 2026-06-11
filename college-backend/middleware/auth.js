const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "global-university-secret-key-2025";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
      college: user.college,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Authenticate - verify JWT token
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

// Authorize - check role(s)
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Insufficient permissions" });
    }
    next();
  };
}

// Scope queries to college for college_admin
function scopeToCollege(req, res, next) {
  if (req.user && req.user.role === "college_admin" && req.user.college) {
    req.collegeScope = req.user.college;
  } else {
    req.collegeScope = null; // super_admin sees all
  }
  next();
}

module.exports = {
  generateToken,
  authenticate,
  authorize,
  scopeToCollege,
  JWT_SECRET,
};
