const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const Application = require("../models/Application");
const { authenticate, authorize, scopeToCollege } = require("../middleware/auth");
const { sendApplicationEmail, sendStatusUpdateEmail } = require("../utils/email");

// Multer storage config - saves to ./uploads/<applicationId>/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "..", "uploads", req.params.applicationId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

// Helper: Generate Application ID (finds max existing ID to avoid duplicates after deletions)
async function generateApplicationId() {
  const latest = await Application.findOne({}, { applicationId: 1 })
    .sort({ applicationId: -1 })
    .lean();

  let next = 1;
  if (latest && latest.applicationId) {
    const match = latest.applicationId.match(/GU2026-(\d+)/);
    if (match) {
      next = parseInt(match[1], 10) + 1;
    }
  }
  return "GU2026-" + String(next).padStart(5, "0");
}

// POST /api/applications - Create new application (public)
router.post("/", async (req, res) => {
  try {
    const formData = req.body.formData;
    if (!formData) {
      return res.status(400).json({ success: false, message: "formData is required" });
    }

    const emailToCheck = (formData.contactInfo && formData.contactInfo.email ? formData.contactInfo.email : "").trim();

    if (!emailToCheck) {
      return res.status(400).json({ success: false, message: "Email is required in contactInfo.email" });
    }

    // Check for duplicate application by email
    const emailFilter = {
      $or: [
        { "data.contactInfo.email": emailToCheck },
        { "data.personalInfo.email": emailToCheck }
      ]
    };

    const excludeAppId = req.query.excludeAppId;
    if (excludeAppId) {
      emailFilter.applicationId = { $ne: excludeAppId };
    }

    const existingApp = await Application.findOne(emailFilter);

    if (existingApp) {
      return res.status(409).json({
        success: false,
        message: "An application with this email already exists.",
        duplicateField: "email",
        applicationId: existingApp.applicationId
      });
    }

    // Check for duplicate application by Aadhar
    const aadharToCheck = (formData.personalInfo && formData.personalInfo.aadharNumber ? formData.personalInfo.aadharNumber : "").trim();
    if (aadharToCheck) {
      const aadharFilter = {
        "data.personalInfo.aadharNumber": aadharToCheck
      };

      if (excludeAppId) {
        aadharFilter.applicationId = { $ne: excludeAppId };
      }

      const existingAppAadhar = await Application.findOne(aadharFilter);

      if (existingAppAadhar) {
        return res.status(409).json({
          success: false,
          message: "An application with this Aadhar number already exists.",
          duplicateField: "aadhar",
          applicationId: existingAppAadhar.applicationId
        });
      }
    }
    const appId = await generateApplicationId();
    const today = new Date().toISOString().slice(0, 10);

    const firstName = formData.personalInfo?.firstName || "";
    const surname = formData.personalInfo?.surname || "";
    const fatherName = formData.personalInfo?.fatherName || "";
    const lastName = formData.personalInfo?.lastName || "";

    const { personalInfo, contactInfo, academicBackground, collegeSelection, programSelection } = formData;

    // Support both old (First Last) and new (Surname First Father) formats
    let name = "";
    if (surname) {
      name = `${surname} ${firstName} ${fatherName}`.trim();
    } else {
      name = `${firstName} ${lastName}`.trim();
    }
    const college = collegeSelection?.collegeCode || "";
    const collegeName = collegeSelection?.collegeName || "";
    const program = `${programSelection?.intendedMajor || "Not specified"} (${programSelection?.admissionTerm || ""})`.trim();

    const newApp = await Application.create({
      applicationId: appId,
      name,
      program,
      college,
      collegeName,
      submittedOn: today,
      status: "Under Review",
      lastUpdated: today,
      queryMessage: "",
      data: formData,
    });

    // Send email (fire and forget)
    sendApplicationEmail({ toEmail: emailToCheck, appId, name, program, date: today, firstName, lastName });

    res.json({ success: true, applicationId: newApp.applicationId });
  } catch (err) {
    console.error("Error creating application:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// POST /api/applications/upload-docs/:applicationId - Upload documents for an application (public - called right after submit)
const documentFields = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'ssc', maxCount: 1 },
  { name: 'hsc', maxCount: 1 },
  { name: 'leaving', maxCount: 1 },
  { name: 'caste', maxCount: 1 }
]);

router.post("/upload-docs/:applicationId", documentFields, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const appDoc = await Application.findOne({ applicationId });
    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    // Build paths map from uploaded files
    const docPaths = {};
    const files = req.files || {};
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fieldNames = ['photo', 'signature', 'aadhar', 'ssc', 'hsc', 'leaving', 'caste'];
    fieldNames.forEach(field => {
      if (files[field] && files[field][0]) {
        docPaths[`${field}Path`] = `/uploads/${applicationId}/${files[field][0].filename}`;
      }
    });

    // Merge paths into data.documents
    const updatedDocs = { ...(appDoc.data?.documents || {}), ...docPaths };
    await Application.updateOne({ applicationId }, { $set: { "data.documents": updatedDocs } });

    res.json({ success: true, message: "Documents uploaded successfully", paths: docPaths });
  } catch (err) {
    console.error("Error uploading documents:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// GET /api/applications - List all (admin, scoped by college)
router.get("/", authenticate, authorize("super_admin", "college_admin"), scopeToCollege, async (req, res) => {
  try {
    const filter = {};
    if (req.collegeScope) {
      filter.college = req.collegeScope;
    }

    const apps = await Application.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, applications: apps });
  } catch (err) {
    console.error("Error fetching applications:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/applications/by-email - Public status checker (email as query param)
router.get("/by-email", async (req, res) => {
  try {
    const email = (req.query.email || "").trim();
    const excludeAppId = (req.query.excludeAppId || "").trim();
    console.log(`[StatusCheck] Search request for email: "${email}"`);

    if (!email) {
      console.log(`[StatusCheck] Rejected: No email provided in query params`);
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    // Escape special regex characters before building the regex
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const emailRegex = new RegExp(`^${escapedEmail}$`, "i");

    const filter = {
      $or: [
        { "data.contactInfo.email": { $regex: emailRegex } },
        { "data.personalInfo.email": { $regex: emailRegex } }
      ]
    };

    if (excludeAppId) {
      filter.applicationId = { $ne: excludeAppId };
    }

    const appDoc = await Application.findOne(filter);

    if (!appDoc) {
      console.log(`[StatusCheck] Not Found: No application matches email "${email}"`);
      return res.status(404).json({ success: false, message: "Application not found for this email" });
    }

    console.log(`[StatusCheck] Success: Found application ${appDoc.applicationId} for email "${email}"`);
    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("[StatusCheck] Server error during email search:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/applications/by-aadhar - Public status checker for duplicate aadhar checking
router.get("/by-aadhar", async (req, res) => {
  try {
    const aadhar = (req.query.aadhar || "").trim();
    const excludeAppId = (req.query.excludeAppId || "").trim();

    if (!aadhar) {
      return res.status(400).json({ success: false, message: "Aadhar is required" });
    }

    const filter = {
      "data.personalInfo.aadharNumber": aadhar
    };

    if (excludeAppId) {
      filter.applicationId = { $ne: excludeAppId };
    }

    const appDoc = await Application.findOne(filter);

    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found for this aadhar" });
    }

    res.json({ success: true, application: { applicationId: appDoc.applicationId } });
  } catch (err) {
    console.error("[StatusCheck] Server error during aadhar search:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PUT /api/applications/:applicationId/edit - Public: applicant resubmits a queried application
router.put("/:applicationId/edit", async (req, res) => {
  try {
    const appId = req.params.applicationId;
    const { formData } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    if (!formData) {
      return res.status(400).json({ success: false, message: "formData is required" });
    }

    const appDoc = await Application.findOne({ applicationId: appId });
    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (appDoc.status !== "Query Raised") {
      return res.status(400).json({ success: false, message: "Only applications with a 'Query Raised' status can be edited" });
    }

    const firstName = formData.personalInfo?.firstName || "";
    const surname = formData.personalInfo?.surname || "";
    const fatherName = formData.personalInfo?.fatherName || "";
    const lastName = formData.personalInfo?.lastName || "";

    let name = "";
    if (surname) {
      name = `${surname} ${firstName} ${fatherName}`.trim();
    } else {
      name = `${firstName} ${lastName}`.trim();
    }

    const college = formData.collegeSelection?.collegeCode || "";
    const collegeName = formData.collegeSelection?.collegeName || "";
    const program = `${formData.programSelection?.intendedMajor || "Not specified"} (${formData.programSelection?.admissionTerm || ""})`.trim();

    // Preserve existing document paths if they exist
    const existingDocuments = appDoc.data?.documents || {};

    appDoc.name = name;
    appDoc.program = program;
    appDoc.college = college;
    appDoc.collegeName = collegeName;
    appDoc.status = "Under Review";
    appDoc.queryMessage = ""; // Clear the query message
    appDoc.data = formData;
    
    // Restore the preserved document paths into the new data
    if (appDoc.data.documents) {
      appDoc.data.documents = { ...existingDocuments, ...appDoc.data.documents };
    } else {
      appDoc.data.documents = existingDocuments;
    }
    
    appDoc.lastUpdated = today;

    await appDoc.save();

    // Send resubmission confirmation email (fire and forget)
    const resubmitEmail = (appDoc.data && appDoc.data.contactInfo && appDoc.data.contactInfo.email) 
      ? appDoc.data.contactInfo.email.trim() 
      : "";
    if (resubmitEmail) {
      sendStatusUpdateEmail({
        toEmail: resubmitEmail,
        appId: appDoc.applicationId,
        name: appDoc.name || "Applicant",
        program: appDoc.program || "",
        status: "Under Review",
        queryMessage: "",
        date: today,
      }).catch((mailErr) => {
        console.error("Error sending resubmission email:", mailErr.message);
      });
    }

    res.json({ success: true, message: "Application resubmitted successfully" });
  } catch (err) {
    console.error("Error editing application:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// GET /api/applications/:applicationId - Public status checker + admin view
router.get("/:applicationId", async (req, res) => {
  try {
    const appId = req.params.applicationId;
    const appDoc = await Application.findOne({ applicationId: appId });

    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("Error fetching application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// PATCH /api/applications/:applicationId - Update status (admin)
router.patch("/:applicationId", authenticate, authorize("super_admin", "college_admin"), scopeToCollege, async (req, res) => {
  try {
    const appId = req.params.applicationId;
    const { status, queryMessage } = req.body;
    const today = new Date().toISOString().slice(0, 10);

    const filter = { applicationId: appId };
    if (req.collegeScope) {
      filter.college = req.collegeScope;
    }

    const appDoc = await Application.findOne(filter);
    if (!appDoc) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    if (status) {
      appDoc.status = status;
      if (status !== "Query Raised") {
        appDoc.queryMessage = "";
      }
    }
    if (typeof queryMessage === "string") appDoc.queryMessage = queryMessage;
    appDoc.lastUpdated = today;

    await appDoc.save();

    // Send status update email (fire and forget - don't await)
    const toEmail = (appDoc.data && appDoc.data.contactInfo && appDoc.data.contactInfo.email) ? appDoc.data.contactInfo.email.trim() : "";
    if (toEmail) {
      sendStatusUpdateEmail({
        toEmail,
        appId: appDoc.applicationId,
        name: appDoc.name || "Applicant",
        program: appDoc.program || "",
        status: appDoc.status,
        queryMessage: appDoc.queryMessage || "",
        date: today,
        actionTakenBy: req.user ? { name: req.user.name, role: req.user.role } : null
      }).catch((mailErr) => {
        console.error("Error sending status update email:", mailErr.message);
      });
    }

    res.json({ success: true, application: appDoc });
  } catch (err) {
    console.error("Error updating application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE /api/applications/:applicationId - Delete (admin)
router.delete("/:applicationId", authenticate, authorize("super_admin", "college_admin"), scopeToCollege, async (req, res) => {
  try {
    const applicationId = (req.params.applicationId || "").trim();
    if (!applicationId) {
      return res.status(400).json({ success: false, message: "Application ID is required" });
    }

    const filter = { applicationId };
    if (req.collegeScope) {
      filter.college = req.collegeScope;
    }

    const deleted = await Application.findOneAndDelete(filter);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Application not found" });
    }

    res.json({ success: true, message: "Application deleted successfully" });
  } catch (err) {
    console.error("Error deleting application:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
