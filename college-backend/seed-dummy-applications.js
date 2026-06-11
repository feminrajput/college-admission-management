const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/university_admissions";

const COLLEGES = [
    { code: "ZSPATEL", name: "Smt Z.S. Patel College for Computer Application and Management", programs: ["BCA", "BBA", "B.Com"] },
    { code: "KPCOMM", name: "Sir K.P. College of Commerce", programs: ["B.Com", "M.Com"] },
    { code: "NAVSCI", name: "Navyug Science College", programs: ["B.Sc", "M.Sc"] }
];

const STATUSES = ["Under Review", "Approved", "Rejected", "Query Raised"];
const QUERY_MSGS = [
    "Please submit an attested copy of your Aadhar card.",
    "Your HSC marksheet appears to be missing. Please re-upload.",
    "Kindly provide a domicile certificate.",
    "Your SEBC/OBC certificate needs to be submitted.",
    ""
];

const FIRST_NAMES = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan", "Krishna", "Ishaan", "Shaurya", "Atharv", "Saanvi", "Aanya", "Aadhya", "Aaradhya", "Ananya", "Pari", "Diya", "Navya", "Femin", "Rahul", "Priya", "Neha", "Karan", "Dipika", "Mitali", "Parthiv", "Zara", "Manav"];
const LAST_NAMES = ["Patel", "Shah", "Desai", "Mehta", "Chauhan", "Parmar", "Rajput", "Pandya", "Trivedi", "Joshi", "Bhatt", "Rathod", "Solanki", "Gohil", "Vaghela", "Modi", "Kapoor", "Sharma", "Verma", "Nair"];
const CITIES = ["Surat", "Ahmedabad", "Vadodara", "Rajkot", "Gandhinagar", "Anand", "Bharuch", "Navsari", "Valsad", "Junagadh"];
const STATES = ["Gujarat", "Rajasthan", "Maharashtra", "Madhya Pradesh", "Uttar Pradesh"];
const GENDERS = ["Male", "Female"];
const CASTES = ["Brahmin", "Patidar", "Rajput", "OBC", "SC", "ST", "General"];
const CATEGORIES = ["General", "SC", "ST", "SEBC", "EWS"];
const SSC_BOARDS = ["GSEB", "CBSE", "ICSE"];
const HSC_STREAMS = ["Science", "Commerce", "Arts"];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n) { return String(n).padStart(5, "0"); }

function randomAadhar() {
    return String(rand(200000000000, 999999999999));
}

function randomDOB() {
    const year = rand(1999, 2005);
    const month = String(rand(1, 12)).padStart(2, "0");
    const day = String(rand(1, 28)).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function makeApp(i) {
    const firstName = pick(FIRST_NAMES);
    const surname = pick(LAST_NAMES);
    const fatherName = `${pick(["Ramesh", "Suresh", "Mahesh", "Dinesh", "Kamlesh"])} ${surname}`;
    const motherName = `${pick(["Anita", "Sunita", "Kavita", "Poonam", "Heena"])} ${surname}`;
    const college = pick(COLLEGES);
    const program = pick(college.programs);
    const status = pick(STATUSES);
    const gender = pick(GENDERS);
    const city = pick(CITIES);
    const state = pick(STATES);
    const email = `${firstName.toLowerCase()}.${surname.toLowerCase()}${rand(1, 99)}@example.com`;
    const phone = `+91 ${rand(7000000000, 9999999999)}`;
    const aadharNumber = randomAadhar();
    const sscBoard = pick(SSC_BOARDS);
    const hscStream = pick(HSC_STREAMS);
    const hscBoard = pick(SSC_BOARDS);
    const sscTotal = 600;
    const sscObtained = rand(350, 590);
    const hscTotal = 700;
    const hscObtained = rand(380, 680);
    const category = pick(CATEGORIES);
    const caste = pick(CASTES);
    const dob = randomDOB();
    const queryMsg = status === "Query Raised" ? pick(QUERY_MSGS.slice(0, 4)) : "";

    const date = new Date();
    date.setDate(date.getDate() - rand(0, 60));
    const dateStr = date.toISOString().split("T")[0];

    return {
        applicationId: `GU2026-${pad(i)}`,
        name: `${firstName} ${surname}`,
        program,
        college: college.code,
        collegeName: college.name,
        submittedOn: dateStr,
        lastUpdated: dateStr,
        status,
        queryMessage: queryMsg,
        createdAt: date,
        data: {
            collegeSelection: { collegeCode: college.code, collegeName: college.name },
            personalInfo: {
                firstName,
                surname,
                fatherName,
                motherName,
                dateOfBirth: dob,
                gender,
                aadharNumber,
                caste,
                category,
                email
            },
            contactInfo: {
                email,
                phone,
                address: `${rand(1, 999)}, ${pick(["Lal Darwaja", "Adajan", "Vesu", "Piplod", "Katargam"])} Society`,
                city,
                stateProvince: state,
                zipPostalCode: String(rand(360001, 395010)),
                country: "India"
            },
            academicBackground: {
                ssc: {
                    board: sscBoard,
                    year: rand(2017, 2022),
                    seatNo: `S${rand(100000, 999999)}`,
                    totalMarks: sscTotal,
                    obtainedMarks: sscObtained
                },
                hsc: {
                    stream: hscStream,
                    board: hscBoard,
                    year: rand(2019, 2024),
                    seatNo: `H${rand(100000, 999999)}`,
                    totalMarks: hscTotal,
                    obtainedMarks: hscObtained
                }
            },
            programSelection: {
                intendedMajor: program,
                admissionTerm: pick(["Semester 1", "Semester 2"])
            },
            documents: {
                isPhotoUploaded: true,
                isSignatureUploaded: true,
                isAadharUploaded: true,
                isSscUploaded: true,
                isHscUploaded: true,
                isLeavingUploaded: rand(0, 1) === 1,
                isCasteUploaded: category !== "General" ? rand(0, 1) === 1 : false
            }
        }
    };
}

async function seed() {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const col = mongoose.connection.db.collection("applications");
    const del = await col.deleteMany({});
    console.log(`Deleted ${del.deletedCount} old applications.`);

    const apps = Array.from({ length: 30 }, (_, i) => makeApp(i + 1));
    const ins = await col.insertMany(apps);
    console.log(`Inserted ${ins.insertedCount} new applications.`);

    await mongoose.disconnect();
    console.log("Done.");
}

seed().catch(err => { console.error(err); process.exit(1); });
