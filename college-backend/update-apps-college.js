const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

async function update() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;

        // Update all applications to belong to ZSPATEL and KPCOMM randomly, but let's just make half ZSPATEL and half KPCOMM
        const apps = await db.collection("applications").find({}).toArray();
        console.log(`Found ${apps.length} applications to update`);

        // Let's just update all to ZSPATEL so the user sees a lot of data immediately
        const result = await db.collection("applications").updateMany({}, {
            $set: {
                college: "ZSPATEL",
                collegeName: "Smt Z.S. Patel College for Computer Application and Management"
            }
        });

        console.log(`Updated ${result.modifiedCount} applications to ZSPATEL`);
        await mongoose.disconnect();
        console.log("Done");
    } catch (err) {
        console.error("Update error:", err);
        process.exit(1);
    }
}

update();
