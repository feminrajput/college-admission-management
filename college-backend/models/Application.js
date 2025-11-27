const mongoose = require('mongoose');

// Helper function for custom number validation
const validateGpa = (val) => val >= 0.0 && val <= 4.0;
const validateSat = (val) => !val || (val >= 400 && val <= 1600); // Optional, but if present, validate

const ApplicationSchema = new mongoose.Schema({
    // --- Personal Information (Step 1) ---
    personalInfo: {
        firstName: { type: String, required: [true, 'First Name is required.'], trim: true, maxlength: 50 },
        lastName: { type: String, required: [true, 'Last Name is required.'], trim: true, maxlength: 50 },
        dateOfBirth: { type: Date, required: [true, 'Date of Birth is required.'] },
        gender: { 
            type: String, 
            required: [true, 'Gender is required.'],
            enum: {
                values: ['male', 'female', 'other', 'prefer-not-to-say'],
                message: '{VALUE} is not a valid gender option.'
            }
        },
    },

    // --- Contact Information (Step 1) ---
    contactInfo: {
        email: { 
            type: String, 
            required: [true, 'Email is required.'], 
            unique: true,
            trim: true,
            match: [/.+@.+\..+/, 'Please enter a valid email address.']
        },
        phone: { type: String, required: [true, 'Phone Number is required.'], trim: true },
        address: { type: String, required: [true, 'Address is required.'], trim: true, maxlength: 100 },
        city: { type: String, required: [true, 'City is required.'], trim: true, maxlength: 50 },
        stateProvince: { type: String, required: [true, 'State/Province is required.'], trim: true, maxlength: 50 },
        zipPostalCode: { type: String, required: [true, 'ZIP/Postal Code is required.'], trim: true, maxlength: 20 },
        country: { type: String, required: [true, 'Country is required.'], trim: true, maxlength: 50 },
    },

    // --- Academic Background (Step 2) ---
    academicBackground: {
        highSchoolName: { type: String, required: [true, 'High School Name is required.'], trim: true, maxlength: 100 },
        graduationYear: { type: Number, required: [true, 'Graduation Year is required.'], min: 1950, max: 2050 },
        gpa: { 
            type: Number, 
            required: [true, 'GPA is required.'], 
            validate: {
                validator: validateGpa,
                message: 'GPA must be between 0.0 and 4.0.'
            }
        },
        satScore: { 
            type: Number, 
            required: false, // Optional
            validate: {
                validator: validateSat,
                message: 'SAT Score must be between 400 and 1600.'
            }
        },
    },

    // --- Program Selection (Step 2) ---
    programSelection: {
        intendedMajor: { type: String, required: [true, 'Intended Major is required.'] },
        admissionTerm: { type: String, required: [true, 'Admission Term is required.'] },
    },

    // --- Documents (Step 3) - Only tracking existence for this simple model ---
    documents: {
        // In a real application, you'd store references to uploaded files (e.g., S3 URLs)
        // For this schema, we just acknowledge the field is present, as file uploads are complex.
        isTranscriptUploaded: { type: Boolean, default: false },
        isStatementUploaded: { type: Boolean, default: false },
    },

    // Meta-data
    submissionDate: { type: Date, default: Date.now },
});

// Custom virtual property for Application ID
ApplicationSchema.virtual('applicationId').get(function() {
    return this._id;
});

ApplicationSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Application', ApplicationSchema);