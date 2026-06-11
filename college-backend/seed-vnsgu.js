const mongoose = require("mongoose");
const College = require("./models/College");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const vnsguColleges = [
    {
        name: "Smt Z.S. Patel College for Computer Application and Management",
        code: "ZSPATEL",
        description: "Affiliated to Veer Narmad South Gujarat University. Offering premier education in computer applications and management.",
        departments: ["Computer Application", "Management"],
        programs: ["BCA", "BBA", "B.Com"],
        icon: "computer",
        isActive: true
    },
    {
        name: "Sir K.P. College of Commerce",
        code: "KPCOMM",
        description: "One of the oldest and most prestigious commerce colleges in South Gujarat region.",
        departments: ["Commerce"],
        programs: ["B.Com", "M.Com"],
        icon: "account_balance",
        isActive: true
    },
    {
        name: "Navyug Science College",
        code: "NAVSCI",
        description: "Leading science college providing quality education in Surat.",
        departments: ["Science"],
        programs: ["B.Sc", "M.Sc"],
        icon: "science",
        isActive: true
    }
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Clear existing
        await College.deleteMany({});
        console.log("Cleared existing colleges");

        // Insert VNSGU colleges
        const docs = await College.insertMany(vnsguColleges);
        console.log(`Inserted ${docs.length} VNSGU colleges`);

        await mongoose.disconnect();
        console.log("Done");
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seed();
