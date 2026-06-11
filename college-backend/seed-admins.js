const mongoose = require("mongoose");
const User = require("./models/User");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const users = [
    {
        username: "uniadmin",
        email: "uni@vnsgu.ac.in",
        password: "uni123",
        name: "VNSGU University Admin",
        role: "super_admin",
        college: null,
        collegeName: null,
    },
    {
        username: "zspatel",
        email: "zspatel@vnsgu.ac.in",
        password: "patel123",
        name: "Z.S. Patel College Admin",
        role: "college_admin",
        college: "ZSPATEL",
        collegeName: "Smt Z.S. Patel College for Computer Application and Management",
    },
    {
        username: "kpcommerce",
        email: "kpcomm@vnsgu.ac.in",
        password: "kp1234",
        name: "K.P. Commerce Admin",
        role: "college_admin",
        college: "KPCOMM",
        collegeName: "Sir K.P. College of Commerce",
    },
    {
        username: "navscience",
        email: "navsci@vnsgu.ac.in",
        password: "sci123",
        name: "Navyug Science Admin",
        role: "college_admin",
        college: "NAVSCI",
        collegeName: "Navyug Science College",
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB for Admin Seeding");

        // Clear existing users
        await User.deleteMany({});
        console.log("Cleared existing users");

        // Seed new simple users
        for (const userData of users) {
            await User.create(userData);
            console.log(`Created user: ${userData.username} (${userData.role}) - Password: ${userData.password}`);
        }

        console.log("\n--- Admin Seeding Complete ---");
        console.log("Super Admin: uniadmin / uni123");
        console.log("College Admin (ZSPATEL): zspatel / patel123");
        console.log("College Admin (KPCOMM): kpcommerce / kp1234");
        console.log("College Admin (NAVSCI): navscience / sci123");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("Seed error:", err);
        process.exit(1);
    }
}

seed();
