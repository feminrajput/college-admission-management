const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/university_admissions')
    .then(async () => {
        const App = mongoose.model('Application', new mongoose.Schema({
            applicationId: String,
            data: Object
        }, { strict: false }));

        const allDocs = await App.find().limit(5);
        const result = allDocs.map(doc => ({
            appId: doc.applicationId,
            emailInContact: doc.data && doc.data.contactInfo ? doc.data.contactInfo.email : undefined,
            emailInPersonal: doc.data && doc.data.personalInfo ? doc.data.personalInfo.email : undefined
        }));
        fs.writeFileSync('debug-result.json', JSON.stringify(result, null, 2));
        console.log("Written to debug-result.json");
        process.exit(0);
    });
