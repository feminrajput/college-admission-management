const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    applicationId: { type: String, unique: true, required: true },
    name: String,
    program: String,
    college: { type: String, default: "" }, // college code
    collegeName: { type: String, default: "" }, // human-readable
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

module.exports = mongoose.model("Application", ApplicationSchema);
