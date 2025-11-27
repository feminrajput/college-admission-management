// server.js

// Load .env variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Config ----------
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const PORT = 6060;

// ---------- Mongo Connection ----------
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB:", MONGODB_URI))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// ---------- Mongoose Schema ----------
const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true, required: true }, // e.g. GU2025-00001
    name: String,
    program: String,
    submittedOn: String,
    status: {
      type: String,
      enum: ["Under Review", "Approved", "Rejected", "Query Raised"],
      default: "Under Review",
    },
    lastUpdated: String,
    queryMessage: { type: String, default: "" },
    data: { type: Object }, // full formData from frontend
  },
  { timestamps: true }
);

const Application = mongoose.model("Application", ApplicationSchema);

// ---------- Helper: Generate Application ID ----------
async function generateApplicationId() {
  const count = await Application.countDocuments();
  const next = count + 1;
  return "GU2025-" + String(next).padStart(5, "0");
}

// ---------- Email (Nodemailer) ----------
const transporter = nodemailer.createTransport({
  // For Gmail; change to host/port if using other provider
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});
console.log("📨 MAIL_USER:", process.env.MAIL_USER ? "SET" : "NOT SET");
console.log("📨 MAIL_PASS:", process.env.MAIL_PASS ? "SET" : "NOT SET");

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP verify error:", error.message);
  } else {
    console.log("✅ SMTP connection is ready to send emails.");
  }
});

const MAIL_FROM = `${
  process.env.MAIL_FROM_NAME || "Admissions Office"
} <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER}>`;

// Helper to send mail safely
async function sendApplicationEmail({
  toEmail,
  appId,
  name,
  program,
  date,
  firstName,
  lastName,
}) {
  if (!toEmail) {
    console.log("⚠️ No toEmail provided, skipping email.");
    return;
  }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("⚠️ MAIL_USER or MAIL_PASS not set, skipping email send.");
    return;
  }

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: toEmail,
      subject: `Your Application has been submitted - ID ${appId}`,
      html: `
        <p>Dear ${firstName} ${lastName},</p>

        <p>Thank you for applying to <strong>Global University</strong>.</p>

        <p>Your application has been received successfully. Your details are:</p>
        <ul>
          <li><strong>Application ID:</strong> ${appId}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Program:</strong> ${program}</li>
          <li><strong>Submitted On:</strong> ${date}</li>
          <li><strong>Status:</strong> Under Review</li>
        </ul>

        <p>You can check your application status anytime using the Application ID or your email on the status page.</p>

        <p>Best regards,<br/>
        Global University Admissions Team</p>
      `,
      text: `Dear ${firstName} ${lastName},

Thank you for applying to Global University.

Your application has been received successfully. Details:
- Application ID: ${appId}
- Name: ${name}
- Program: ${program}
- Submitted On: ${date}
- Status: Under Review

You can check your application status anytime using this Application ID or your email.

Best regards,
Global University Admissions Team`,
    });

    console.log("📧 Email sent to:", toEmail);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}
// Helper to send status update email
async function sendStatusUpdateEmail({
  toEmail,
  appId,
  name,
  program,
  status,
  queryMessage,
  date,
}) { console.log("🔔 sendStatusUpdateEmail called for:", toEmail, "Status:", status);
  if (!toEmail) {
    console.log("⚠️ No toEmail for status update, skipping email.");
    return;
  }
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("⚠️ MAIL_USER or MAIL_PASS not set, skipping status email send.");
    return;
  }

  let subjectStatusPart = status;
  if (status === "Approved") subjectStatusPart = "Approved";
  else if (status === "Rejected") subjectStatusPart = "Rejected";
  else if (status === "Query Raised") subjectStatusPart = "Query / Clarification Required";
  else subjectStatusPart = status || "Updated";

  const subject = `Application ${subjectStatusPart} - ID ${appId}`;

  let statusLine = `Your application status is now: ${status}.`;
  if (status === "Approved") {
    statusLine = "✅ Your application has been APPROVED.";
  } else if (status === "Rejected") {
    statusLine = "❌ Your application has been REJECTED.";
  } else if (status === "Query Raised") {
    statusLine = "⚠️ A QUERY has been raised on your application. Please review the note below.";
  }

  const queryBlockHtml = queryMessage
    ? `<p><strong>Note from Admissions:</strong><br>${queryMessage}</p>`
    : "";

  const queryBlockText = queryMessage
    ? `\nNote from Admissions:\n${queryMessage}\n`
    : "";

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: toEmail,
      subject,
      html: `
        <p>Dear ${name},</p>

        <p>${statusLine}</p>

        <p>Your application details:</p>
        <ul>
          <li><strong>Application ID:</strong> ${appId}</li>
          <li><strong>Program:</strong> ${program}</li>
          <li><strong>Last Updated:</strong> ${date}</li>
          <li><strong>Current Status:</strong> ${status}</li>
        </ul>

        ${queryBlockHtml}

        <p>You can check your application status anytime using your Application ID or email on the status page.</p>

        <p>Best regards,<br/>
        Global University Admissions Team</p>
      `,
      text: `Dear ${name},

${statusLine}

Application details:
- Application ID: ${appId}
- Program: ${program}
- Last Updated: ${date}
- Current Status: ${status}
${queryBlockText}
You can check your application status anytime using your Application ID or email on the status page.

Best regards,
Global University Admissions Team`,
    });

    console.log("📧 Status update email sent to:", toEmail, "Status:", status);
  } catch (err) {
    console.error("❌ Error sending status update email:", err.message);
  }
}

// ---------- Routes ----------

// Simple test route
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// Create new application (with duplicate email check + email notification)
app.post("/api/applications", async (req, res) => {
  try {
    console.log("📩 POST /api/applications body:", req.body);

    const formData = req.body.formData;
    if (!formData) {
      return res
        .status(400)
        .json({ success: false, message: "formData is required" });
    }

    const emailToCheck =
      (formData.contactInfo && formData.contactInfo.email
        ? formData.contactInfo.email
        : ""
      ).trim();

    if (!emailToCheck) {
      return res.status(400).json({
        success: false,
        message: "Email is required in contactInfo.email",
      });
    }

    // 🔍 Duplicate email check
    const existing = await Application.findOne({
      "data.contactInfo.email": emailToCheck,
    });
// if an application with this email already exists, return 409
if (existing) {
  return res.status(409).json({
    success: false,
    message: `This email (${emailToCheck}) has already been used to submit an application.`,
    applicationId: existing.applicationId,
  });
}



    const appId = await generateApplicationId();
    const today = new Date().toISOString().slice(0, 10);

    const firstName =
      formData.personalInfo && formData.personalInfo.firstName
        ? formData.personalInfo.firstName
        : "";
    const lastName =
      formData.personalInfo && formData.personalInfo.lastName
        ? formData.personalInfo.lastName
        : "";
    const name = `${firstName} ${lastName}`.trim();

    const intendedMajor =
      formData.programSelection && formData.programSelection.intendedMajor
        ? formData.programSelection.intendedMajor
        : "";
    const admissionTerm =
      formData.programSelection && formData.programSelection.admissionTerm
        ? formData.programSelection.admissionTerm
        : "";
    const program = `${intendedMajor} (${admissionTerm})`;

    const newApp = await Application.create({
      applicationId: appId,
      name,
      program,
      submittedOn: today,
      status: "Under Review",
      lastUpdated: today,
      queryMessage: "",
      data: formData,
    });

    console.log("✅ Application saved with ID:", newApp.applicationId);
    console.log("👉 Calling sendApplicationEmail for:", emailToCheck);

    // Send email (fire and forget)
    sendApplicationEmail({
      toEmail: emailToCheck,
      appId,
      name,
      program,
      date: today,
      firstName,
      lastName,
    });

    res.json({ success: true, applicationId: newApp.applicationId });
  } catch (err) {
    console.error("❌ Error creating application:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

// ⚠ IMPORTANT: "by-email" BEFORE ":applicationId"

// Get application by Email (status checker)
app.get("/api/applications/by-email/:email", async (req, res) => {
  try {
    const rawEmail = req.params.email || "";
    const email = decodeURIComponent(rawEmail).trim();

    console.log("📥 GET /api/applications/by-email/", email);

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const appDoc = await Application.findOne({
      "data.contactInfo.email": { $regex: new RegExp(`^${email}$`, "i") },
    });

    if (!appDoc) {
      return res.status(404).json({
        success: false,
        message: "Application not found for this email",
      });
    }

    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("❌ Error fetching application by email:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get application by ID (status checker + admin view)
app.get("/api/applications/:applicationId", async (req, res) => {
  try {
    const appId = req.params.applicationId;
    console.log("📥 GET /api/applications/", appId);
    const appDoc = await Application.findOne({ applicationId: appId });

    if (!appDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("❌ Error fetching application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// List all applications (admin dashboard)
app.get("/api/applications", async (req, res) => {
  try {
    console.log("📥 GET /api/applications (list)");
    const apps = await Application.find().sort({ createdAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (err) {
    console.error("❌ Error fetching applications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete application (admin action)
app.delete("/api/applications/:applicationId", async (req, res) => {
  try {
    const rawId = req.params.applicationId || "";
    const applicationId = rawId.trim(); // remove any spaces

    console.log("🗑️ DELETE /api/applications/", `"${applicationId}"`);

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const deleted = await Application.findOneAndDelete({ applicationId });

    if (!deleted) {
      console.log("⚠️ No application found to delete for ID:", applicationId);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    console.log("✅ Deleted Application:", applicationId);

    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


// Update status / query (admin actions)
app.patch("/api/applications/:applicationId", async (req, res) => {
  try {
    const appId = req.params.applicationId;
    const { status, queryMessage } = req.body;
    console.log("✏️ PATCH /api/applications/", appId, " body:", req.body);

    const today = new Date().toISOString().slice(0, 10);

    const appDoc = await Application.findOne({ applicationId: appId });
    if (!appDoc) {
      return res
        .status(404)
        .json({ success: false, message: "Application not found" });
    }

    if (status) appDoc.status = status;
    if (typeof queryMessage === "string") appDoc.queryMessage = queryMessage;
    appDoc.lastUpdated = today;

    await appDoc.save();

    // 🔔 Send status update email
    try {
      const toEmail =
        appDoc.data &&
        appDoc.data.contactInfo &&
        appDoc.data.contactInfo.email
          ? appDoc.data.contactInfo.email.trim()
          : "";

      const name = appDoc.name || "Applicant";
      const program = appDoc.program || "";
      const currentStatus = appDoc.status;
      const currentQueryMessage = appDoc.queryMessage || "";

      sendStatusUpdateEmail({
        toEmail,
        appId: appDoc.applicationId,
        name,
        program,
        status: currentStatus,
        queryMessage: currentQueryMessage,
        date: today,
      });
    } catch (mailErr) {
      console.error("❌ Error triggering status update email:", mailErr.message);
    }

    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("❌ Error updating application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/// ===================== DELETE APPLICATION =====================
app.delete("/api/applications/:applicationId", async (req, res) => {
  try {
    const rawId = req.params.applicationId || "";
    const applicationId = rawId.trim(); // <-- important: remove spaces

    console.log("🗑️ DELETE /api/applications/", `"${applicationId}"`);

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: "Application ID is required",
      });
    }

    const deleted = await Application.findOneAndDelete({ applicationId });

    if (!deleted) {
      console.log("⚠️ No application found to delete for ID:", applicationId);
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    console.log("✅ Deleted Application:", applicationId);

    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ---------- Start Server ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://127.0.0.1:${PORT}`);
});
