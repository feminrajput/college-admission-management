// Seed script - creates default super admin, colleges, and college admins
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const College = require("../models/College");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const colleges = [
  {
    name: "School of Engineering & Technology",
    code: "ENGG",
    description: "Pioneering innovation through cutting-edge engineering and technology programs.",
    departments: ["Computer Science", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering"],
    programs: [
      "Computer Science (Fall 2025)",
      "Computer Science (Spring 2026)",
      "Mechanical Engineering (Fall 2025)",
      "Electrical Engineering (Fall 2025)",
      "Civil Engineering (Fall 2025)",
    ],
    icon: "cpu",
  },
  {
    name: "College of Arts & Humanities",
    code: "ARTS",
    description: "Exploring creativity, culture, and the human experience through diverse liberal arts programs.",
    departments: ["English Literature", "History", "Philosophy", "Fine Arts"],
    programs: [
      "English Literature (Fall 2025)",
      "History (Fall 2025)",
      "Philosophy (Fall 2025)",
      "Fine Arts (Fall 2025)",
    ],
    icon: "palette",
  },
  {
    name: "School of Business & Management",
    code: "BIZ",
    description: "Developing future business leaders with world-class management education.",
    departments: ["Finance", "Marketing", "Management", "Accounting"],
    programs: [
      "Business Administration (Fall 2025)",
      "Finance (Fall 2025)",
      "Marketing (Fall 2025)",
      "Accounting (Fall 2025)",
    ],
    icon: "briefcase",
  },
  {
    name: "Faculty of Sciences",
    code: "SCI",
    description: "Advancing scientific discovery through rigorous research and hands-on learning.",
    departments: ["Physics", "Chemistry", "Biology", "Mathematics"],
    programs: [
      "Physics (Fall 2025)",
      "Chemistry (Fall 2025)",
      "Biology (Fall 2025)",
      "Mathematics (Fall 2025)",
    ],
    icon: "flask",
  },
];

const users = [
  {
    username: "superadmin",
    email: "superadmin@globaluniversity.edu",
    password: "SuperAdmin@2025",
    name: "University Administrator",
    role: "super_admin",
    college: null,
    collegeName: null,
  },
  {
    username: "engg_admin",
    email: "engg.admin@globaluniversity.edu",
    password: "EnggAdmin@2025",
    name: "Engineering Admin",
    role: "college_admin",
    college: "ENGG",
    collegeName: "School of Engineering & Technology",
  },
  {
    username: "arts_admin",
    email: "arts.admin@globaluniversity.edu",
    password: "ArtsAdmin@2025",
    name: "Arts & Humanities Admin",
    role: "college_admin",
    college: "ARTS",
    collegeName: "College of Arts & Humanities",
  },
  {
    username: "biz_admin",
    email: "biz.admin@globaluniversity.edu",
    password: "BizAdmin@2025",
    name: "Business Admin",
    role: "college_admin",
    college: "BIZ",
    collegeName: "School of Business & Management",
  },
  {
    username: "sci_admin",
    email: "sci.admin@globaluniversity.edu",
    password: "SciAdmin@2025",
    name: "Sciences Admin",
    role: "college_admin",
    college: "SCI",
    collegeName: "Faculty of Sciences",
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB:", MONGODB_URI);

    // Seed colleges
    console.log("\n--- Seeding Colleges ---");
    for (const collegeData of colleges) {
      const existing = await College.findOne({ code: collegeData.code });
      if (existing) {
        console.log(`  College "${collegeData.name}" (${collegeData.code}) already exists, skipping.`);
      } else {
        await College.create(collegeData);
        console.log(`  Created college: "${collegeData.name}" (${collegeData.code})`);
      }
    }

    // Seed users
    console.log("\n--- Seeding Users ---");
    for (const userData of users) {
      const existing = await User.findOne({ username: userData.username });
      if (existing) {
        console.log(`  User "${userData.username}" already exists, skipping.`);
      } else {
        await User.create(userData);
        console.log(`  Created user: "${userData.username}" (${userData.role})`);
      }
    }

    console.log("\n--- Seed Complete ---");
    console.log("\nDefault credentials:");
    console.log("  Super Admin:  superadmin / SuperAdmin@2025");
    console.log("  ENGG Admin:   engg_admin / EnggAdmin@2025");
    console.log("  ARTS Admin:   arts_admin / ArtsAdmin@2025");
    console.log("  BIZ Admin:    biz_admin / BizAdmin@2025");
    console.log("  SCI Admin:    sci_admin / SciAdmin@2025");

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error("Seed error:", err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
