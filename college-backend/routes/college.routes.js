const express = require("express");
const router = express.Router();
const College = require("../models/College");
const { authenticate, authorize } = require("../middleware/auth");

// GET /api/colleges - List active colleges (public)
router.get("/", async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const filter = showAll ? {} : { isActive: true };
    const colleges = await College.find(filter).sort({ name: 1 });
    res.json({ success: true, colleges });
  } catch (err) {
    console.error("Error fetching colleges:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/colleges/:id - Get single college
router.get("/:id", async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }
    res.json({ success: true, college });
  } catch (err) {
    console.error("Error fetching college:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/colleges - Create college (super_admin only)
router.post("/", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const { name, code, description, departments, programs, icon } = req.body;

    if (!name || !code) {
      return res.status(400).json({ success: false, message: "Name and code are required" });
    }

    const existing = await College.findOne({ $or: [{ name }, { code: code.toUpperCase() }] });
    if (existing) {
      return res.status(409).json({ success: false, message: "College name or code already exists" });
    }

    const college = await College.create({
      name,
      code: code.toUpperCase(),
      description: description || "",
      departments: departments || [],
      programs: programs || [],
      icon: icon || "school",
    });

    res.status(201).json({ success: true, college });
  } catch (err) {
    console.error("Error creating college:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// PATCH /api/colleges/:id - Update college (super_admin only)
router.patch("/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const { name, code, description, departments, programs, icon, isActive } = req.body;

    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    if (name) college.name = name;
    if (code) college.code = code.toUpperCase();
    if (description !== undefined) college.description = description;
    if (departments) college.departments = departments;
    if (programs) college.programs = programs;
    if (icon) college.icon = icon;
    if (typeof isActive === "boolean") college.isActive = isActive;

    await college.save();

    res.json({ success: true, college });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "College code already exists." });
    }
    console.error("Error updating college:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// DELETE /api/colleges/:id - Deactivate college (super_admin only)
router.delete("/:id", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const college = await College.findById(req.params.id);
    if (!college) {
      return res.status(404).json({ success: false, message: "College not found" });
    }

    college.isActive = false;
    await college.save();

    res.json({ success: true, message: "College deactivated successfully" });
  } catch (err) {
    console.error("Error deactivating college:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
