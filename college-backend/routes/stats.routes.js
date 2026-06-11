const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const College = require("../models/College");
const User = require("../models/User");
const { authenticate, authorize, scopeToCollege } = require("../middleware/auth");

// GET /api/stats - Dashboard statistics (scoped by role)
router.get("/", authenticate, authorize("super_admin", "college_admin"), scopeToCollege, async (req, res) => {
  try {
    const filter = {};
    if (req.collegeScope) {
      filter.college = req.collegeScope;
    }

    const [total, underReview, approved, rejected, queryRaised] = await Promise.all([
      Application.countDocuments(filter),
      Application.countDocuments({ ...filter, status: "Under Review" }),
      Application.countDocuments({ ...filter, status: "Approved" }),
      Application.countDocuments({ ...filter, status: "Rejected" }),
      Application.countDocuments({ ...filter, status: "Query Raised" }),
    ]);

    // Today's applications
    const today = new Date().toISOString().slice(0, 10);
    const todayCount = await Application.countDocuments({ ...filter, submittedOn: today });

    // Recent applications (last 5)
    const recentApplications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("applicationId name program status submittedOn college collegeName");

    res.json({
      success: true,
      stats: {
        total,
        underReview,
        approved,
        rejected,
        queryRaised,
        todayCount,
      },
      recentApplications,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/stats/overview - University-wide overview (super_admin only)
router.get("/overview", authenticate, authorize("super_admin"), async (req, res) => {
  try {
    const [totalApps, activeColleges, activeUsers, colleges] = await Promise.all([
      Application.countDocuments(),
      College.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      College.find({ isActive: true }).select("name code"),
    ]);

    // Per-college breakdown
    const collegeStats = await Promise.all(
      colleges.map(async (college) => {
        const filter = { college: college.code };
        const [total, underReview, approved, rejected] = await Promise.all([
          Application.countDocuments(filter),
          Application.countDocuments({ ...filter, status: "Under Review" }),
          Application.countDocuments({ ...filter, status: "Approved" }),
          Application.countDocuments({ ...filter, status: "Rejected" }),
        ]);
        return {
          collegeName: college.name,
          collegeCode: college.code,
          total,
          underReview,
          approved,
          rejected,
        };
      })
    );

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const yearMonth = d.toISOString().slice(0, 7); // YYYY-MM
      const count = await Application.countDocuments({
        submittedOn: { $regex: new RegExp(`^${yearMonth}`) },
      });
      monthlyTrend.push({
        month: d.toLocaleString("default", { month: "short", year: "numeric" }),
        count,
      });
    }

    res.json({
      success: true,
      overview: {
        totalApplications: totalApps,
        activeColleges,
        activeUsers,
        collegeStats,
        monthlyTrend,
      },
    });
  } catch (err) {
    console.error("Error fetching overview:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/stats/public - Public university-wide statistics
router.get("/public", async (req, res) => {
  try {
    const activeColleges = await College.find({ isActive: true });
    
    // Aggregating programs and departments from active colleges
    let totalPrograms = 0;
    let totalDepts = 0;
    activeColleges.forEach(c => {
      totalPrograms += (c.programs || []).length;
      totalDepts += (c.departments || []).length;
    });

    const totalApplications = await Application.countDocuments();

    res.json({
      success: true,
      stats: {
        totalApplications,
        activeColleges: activeColleges.length,
        totalPrograms,
        totalDepts
      }
    });
  } catch (err) {
    console.error("Error fetching public stats:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;

