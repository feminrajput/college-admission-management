const mongoose = require("mongoose");

const CollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "College name is required"],
      unique: true,
      trim: true,
      maxlength: 150,
    },
    code: {
      type: String,
      required: [true, "College code is required"],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },
    description: {
      type: String,
      default: "",
      maxlength: 500,
    },
    departments: {
      type: [String],
      default: [],
    },
    programs: {
      type: [String],
      default: [],
    },
    icon: {
      type: String,
      default: "school", // icon identifier for frontend
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("College", CollegeSchema);
