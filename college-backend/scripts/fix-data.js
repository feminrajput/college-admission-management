const mongoose = require("mongoose");
const Application = require("../models/Application");
const College = require("../models/College");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

async function fixData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Get all colleges to build a mapping
        const colleges = await College.find({});
        const collegeMap = {};
        colleges.forEach(c => {
            collegeMap[c.code] = c.name;
        });

        // Find applications with empty college field
        const apps = await Application.find({ college: "" });
        console.log(`Found ${apps.length} applications with missing college field.`);

        let updatedCount = 0;
        for (const app of apps) {
            // Try to determine college from program string
            // Example: "Computer Science (Fall 2025)" -> check if any college has this program
            let inferredCollege = "";
            let inferredCollegeName = "";

            for (const college of colleges) {
                // Check if program name (or part of it) is in the college's programs list
                const programMatches = college.programs.some(p =>
                    app.program.toLowerCase().includes(p.toLowerCase())
                );

                if (programMatches) {
                    inferredCollege = college.code;
                    inferredCollegeName = college.name;
                    break;
                }
            }

            // Default to "ENGG" if we can't infer and it's for testing, 
            // but better to leave as is if we're not sure.
            // For this specific case, if it's "Computer Science", it's ENGG.
            if (!inferredCollege && app.program.toLowerCase().includes("computer")) {
                inferredCollege = "ENGG";
                inferredCollegeName = "School of Engineering & Technology";
            }

            if (inferredCollege) {
                app.college = inferredCollege;
                app.collegeName = inferredCollegeName;
                await app.save();
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} applications.`);
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}

fixData();
