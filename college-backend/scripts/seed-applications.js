const mongoose = require("mongoose");
const Application = require("../models/Application");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const sampleApplications = [
    {
        applicationId: "GU2025-00101",
        name: "John Doe",
        program: "Computer Science (Fall 2025)",
        college: "ENGG",
        collegeName: "School of Engineering & Technology",
        submittedOn: new Date().toISOString().slice(0, 10),
        status: "Under Review",
        lastUpdated: new Date().toISOString().slice(0, 10),
        data: {
            personalInfo: { firstName: "John", lastName: "Doe", dateOfBirth: "2005-05-15", gender: "male" },
            contactInfo: { email: "john.doe@example.com", phone: "9876543210", address: "123 Main St", city: "New York", stateProvince: "NY", zipPostalCode: "10001", country: "us" },
            academicBackground: { highSchoolName: "Central High", graduationYear: 2023, gpa: 3.8 },
            programSelection: { intendedMajor: "Computer Science", admissionTerm: "Fall 2025" }
        }
    },
    {
        applicationId: "GU2025-00102",
        name: "Jane Smith",
        program: "History (Fall 2025)",
        college: "ARTS",
        collegeName: "College of Arts & Humanities",
        submittedOn: new Date().toISOString().slice(0, 10),
        status: "Approved",
        lastUpdated: new Date().toISOString().slice(0, 10),
        data: {
            personalInfo: { firstName: "Jane", lastName: "Smith", dateOfBirth: "2006-02-20", gender: "female" },
            contactInfo: { email: "jane.smith@example.com", phone: "9123456780", address: "456 Oak Ave", city: "London", stateProvince: "LDN", zipPostalCode: "EC1A 1BB", country: "uk" },
            academicBackground: { highSchoolName: "Westside Academy", graduationYear: 2024, gpa: 3.9 },
            programSelection: { intendedMajor: "History", admissionTerm: "Fall 2025" }
        }
    }
];

async function seedApplications() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        await Application.deleteMany({ applicationId: { $in: ["GU2025-00101", "GU2025-00102"] } });
        await Application.insertMany(sampleApplications);

        console.log("Seed Applications successful");
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seedApplications();
