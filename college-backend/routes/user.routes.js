const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { authenticate, authorize } = require("../middleware/auth");

// GET /api/users - List all admin users (super_admin only)
router.get("/", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/users/:id - Get single user
router.get("/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/users - Create new admin user (super_admin only)
router.post("/", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const { username, email, password, name, role, college, collegeName } = req.body;

    if (!username || !email || !password || !name || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!["super_admin", "college_admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    if (role === "college_admin" && !college) {
      return res.status(400).json({ success: false, message: "College is required for college_admin" });
    }

    // Check existing
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Username or email already exists" });
    }

    const user = await User.create({
      username,
      email,
      password,
      name,
      role,
      college: role === "college_admin" ? college : null,
      collegeName: role === "college_admin" ? collegeName : null,
    });

    res.status(201).json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error("Error creating user:", err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Username or email already exists in database." });
    }
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// PATCH /api/users/:id - Update user (super_admin only)
router.patch("/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const { name, email, role, college, collegeName, isActive, password } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) {
      user.role = role;
      if (role === "super_admin") {
        user.college = null;
        user.collegeName = null;
      }
    }
    if (college !== undefined) user.college = college;
    if (collegeName !== undefined) user.collegeName = collegeName;
    if (typeof isActive === "boolean") user.isActive = isActive;
    if (password) user.password = password; // will be hashed by pre-save hook

    await user.save();

    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    console.error("Error updating user:", err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Username or email already exists in database." });
    }
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// DELETE /api/users/:id - Deactivate user (super_admin only)
router.delete("/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot deactivate your own account" });
    }

    user.isActive = false;
    await user.save();

    res.json({ success: true, message: "User deactivated successfully" });
  } catch (err) {
    console.error("Error deactivating user:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
