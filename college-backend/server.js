require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const { transporter } = require("./utils/email");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------- Config ----------
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";
const PORT = process.env.PORT || 6060;

// ---------- MongoDB Connection ----------
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB:", MONGODB_URI);
    transporter.verify(function (error, success) {
      if (error) {
        console.log("SMTP connection not ready:", error.message);
      } else {
        console.log("SMTP is ready to send emails");
      }
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });

// ---------- Routes ----------
const authRoutes = require("./routes/auth.routes");
const applicationRoutes = require("./routes/application.routes");
const userRoutes = require("./routes/user.routes");
const collegeRoutes = require("./routes/college.routes");
const statsRoutes = require("./routes/stats.routes");
const otpRoutes = require("./routes/otp.routes");

// Health check
app.get("/", (req, res) => {
  res.send("API is running");
});


app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/colleges", collegeRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/otp", otpRoutes);

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});
