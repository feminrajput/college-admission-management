import React, { useState, useCallback, useEffect, useMemo } from 'react';
// Flatpickr imports REMOVED and replaced with CDN links in FlatpickrCDN component
import { Menu, X, Home, FileText, User, BookOpen, FileUp, CheckCircle } from 'lucide-react'; 

// --- 1. UTILITY FUNCTIONS (COMBINED FROM validation.js) ---

const MINIMUM_AGE = 16; 
const totalSteps = 4;
const API_URL = 'http://localhost:3000/api/applications'; // Mock API endpoint

function isMinimumAgeMet(birthDateString, requiredAge) {
    if (!birthDateString) return false;
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    // Calculate the date that is 'requiredAge' years after birthDate
    const minimumValidDate = new Date(birthDate.getFullYear() + requiredAge, birthDate.getMonth(), birthDate.getDate());
    
    // Check if today is equal to or after that minimum date
    return today >= minimumValidDate;
}

function validateStep(stepNumber, formData) {
    switch(stepNumber) {
        case 1: 
            const p = formData.personalInfo;
            const c = formData.contactInfo;
            if (!p.firstName || !p.lastName || !p.gender || 
                !c.email || !c.phone || !c.address || !c.city || 
                !c.stateProvince || !c.zipPostalCode || !c.country) return false;
            
            // Check for valid date format and minimum age
            const isDateValid = !!p.dateOfBirth && p.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/);
            if (!isDateValid || !isMinimumAgeMet(p.dateOfBirth, MINIMUM_AGE)) return false;
            
            return true;
        
        case 2:
            const a = formData.academicBackground;
            const s = formData.programSelection;
            if (!a.highSchoolName || !a.graduationYear || !a.gpa ||
                !s.intendedMajor || !s.admissionTerm) return false;
            
            const gpaValue = parseFloat(a.gpa);
            if (isNaN(gpaValue) || gpaValue > 4.0 || gpaValue < 0) return false;
            
            return true;
        
        case 3:
            const d = formData.documents;
            if (!d.transcript || !d.personalStatement) return false;
            
            return true;
        
        case 4: 
            return validateStep(1, formData) && validateStep(2, formData) && validateStep(3, formData);
        
        default: return true;
    }
}

function getTabNameByStep(step) {
    switch(step) {
        case 1: return 'personal';
        case 2: return 'academic';
        case 3: return 'documents';
        case 4: return 'review';
        default: return 'personal';
    }
}

function getStepByTabName(tabName) {
    switch(tabName) {
        case 'personal': return 1;
        case 'academic': return 2;
        case 'documents': return 3;
        case 'review': return 4;
        default: return 1;
    }
}

// --- 2. COMMON COMPONENTS ---

const FormField = ({ label, id, value, onChange, type = 'text', required, children, ...props }) => (
    <div>
        <label className="field-label">{label} {required && <span className="required">*</span>}</label>
        {children || (
            <input
                type={type}
                className="form-field"
                id={id}
                value={value}
                onChange={(e) => onChange(id, e.target.value)}
                required={required}
                {...props}
            />
        )}
    </div>
);

const TabNavigation = ({ currentStep, tabValidity, onTabClick, warningsEnabled }) => {
    const tabSteps = [
        { id: 1, name: 'personal', label: 'Personal Information', icon: User },
        { id: 2, name: 'academic', label: 'Academic Background', icon: BookOpen },
        { id: 3, name: 'documents', label: 'Documents', icon: FileUp },
        { id: 4, name: 'review', label: 'Review & Submit', icon: CheckCircle },
    ];
    
    return (
        <div className="main-card p-4 md:p-8 flex justify-between flex-wrap shadow-inner-lg">
            {tabSteps.map(({ id, name, label, icon: Icon }) => {
                const isActive = id === currentStep;
                const isAccessible = id <= currentStep; 
                const needsAttention = warningsEnabled && id < totalSteps && !tabValidity[id];

                return (
                    <button
                        key={id}
                        className={`tab ${isActive ? 'active' : ''} ${needsAttention ? 'needs-attention' : ''} flex-1 min-w-[120px] mx-1 my-1`}
                        id={`tab-${name}`}
                        disabled={!isAccessible}
                        onClick={() => isAccessible && onTabClick(name)}
                    >
                        <Icon className="w-4 h-4 mr-2 hidden sm:inline" />
                        {label}
                        <span className="tab-warning" style={{ display: needsAttention ? 'inline-block' : 'none' }}>!</span>
                    </button>
                );
            })}
        </div>
    );
};


// --- 3. TAB COMPONENTS ---

const PersonalInformation = ({ formData, updateFormData, nextTab, previousTab }) => {
    const { personalInfo, contactInfo } = formData;

    const handleChange = (section, id, value) => {
        updateFormData(section, { [id]: value });
    };
    
    // State for the Flatpickr instance
    const dateInputRef = React.useRef(null);

    // Calculate max allowed date for minimum age validation
    const today = new Date();
    const maxAllowedDate = new Date(today.getFullYear() - MINIMUM_AGE, today.getMonth(), today.getDate());
    const maxDateString = maxAllowedDate.toISOString().split('T')[0];

    // Effect to initialize Flatpickr when the component mounts
    useEffect(() => {
        // Ensure flatpickr is defined globally before initializing
        if (dateInputRef.current && typeof flatpickr !== 'undefined') {
            const fp = flatpickr(dateInputRef.current, {
                dateFormat: "Y-m-d",
                altInput: true,
                altFormat: "F j, Y",
                maxDate: maxDateString,
                defaultDate: personalInfo.dateOfBirth,
                onChange: (selectedDates, dateStr) => {
                    handleChange('personalInfo', 'dateOfBirth', dateStr);
                },
            });
            // Cleanup function to destroy the flatpickr instance
            return () => {
                fp.destroy();
            };
        }
    }, [maxDateString]); // Re-run effect if maxDateString changes (though it shouldn't)

    return (
        <div id="personal" className="tab-content">
            <div className="form-section">
                <h3 className="section-title">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="First Name" id="firstName" value={personalInfo.firstName} required={true} 
                        onChange={(id, v) => handleChange('personalInfo', id, v)} 
                        placeholder="Enter your first name" 
                    />
                    <FormField label="Last Name" id="lastName" value={personalInfo.lastName} required={true} 
                        onChange={(id, v) => handleChange('personalInfo', id, v)}
                        placeholder="Enter your last name" 
                    />
                    
                    <FormField label="Date of Birth (YYYY-MM-DD)" id="dateOfBirth" required={true}>
                        {/* Using a standard input and attaching Flatpickr via Ref */}
                        <input
                            type="text"
                            className="form-field flatpickr-input"
                            id="dateOfBirth"
                            ref={dateInputRef}
                            defaultValue={personalInfo.dateOfBirth} // Use defaultValue for controlled by FP
                            data-input 
                            placeholder="Select Date"
                        />
                        <p className="text-xs text-gray-500 mt-1">Applicants must be {MINIMUM_AGE} years or older. Max date: {maxDateString}</p>
                    </FormField>

                    <FormField label="Gender" id="gender" value={personalInfo.gender} required={true} 
                        onChange={(id, v) => handleChange('personalInfo', id, v)}
                    >
                        <select className="form-field" id="gender" value={personalInfo.gender} required 
                            onChange={(e) => handleChange('personalInfo', 'gender', e.target.value)}>
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </FormField>
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Email Address" id="email" type="email" value={contactInfo.email} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                        placeholder="your.email@example.com" 
                    />
                    <FormField label="Phone Number" id="phone" type="tel" value={contactInfo.phone} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                        placeholder="+1 (555) 123-4567" 
                    />
                    <div className="md:col-span-2">
                        <FormField label="Address" id="address" value={contactInfo.address} required={true} 
                            onChange={(id, v) => handleChange('contactInfo', id, v)}
                            placeholder="Street address" 
                        />
                    </div>
                    <FormField label="City" id="city" value={contactInfo.city} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                        placeholder="City" 
                    />
                    <FormField label="State/Province" id="stateProvince" value={contactInfo.stateProvince} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                        placeholder="State or Province" 
                    />
                    <FormField label="ZIP/Postal Code" id="zipPostalCode" value={contactInfo.zipPostalCode} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                        placeholder="ZIP or Postal Code" 
                    />
                    <FormField label="Country" id="country" value={contactInfo.country} required={true} 
                        onChange={(id, v) => handleChange('contactInfo', id, v)}
                    >
                        <select className="form-field" id="country" value={contactInfo.country} required 
                            onChange={(e) => handleChange('contactInfo', 'country', e.target.value)}>
                            <option value="">Select country</option>    
                            <option value="in">India</option>
                            <option value="us">United States</option>
                            <option value="ca">Canada</option>
                            <option value="uk">United Kingdom</option>
                            <option value="au">Australia</option>
                            <option value="other">Other</option>
                        </select>
                    </FormField>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <button className="btn-secondary opacity-50 cursor-not-allowed" disabled={true}>Previous</button>
                <button className="btn-primary" onClick={nextTab}>Continue to Academic Background</button>
            </div>
        </div>
    );
}

const AcademicBackground = ({ formData, updateFormData, nextTab, previousTab }) => {
    const { academicBackground, programSelection } = formData;

    const handleChange = (section, id, value) => {
        updateFormData(section, { [id]: value });
    };

    return (
        <div id="academic" className="tab-content">
            <div className="form-section">
                <h3 className="section-title">Educational Background</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="High School Name" id="highSchoolName" value={academicBackground.highSchoolName} required={true} 
                        onChange={(id, v) => handleChange('academicBackground', id, v)} 
                        placeholder="Name of your high school" 
                    />
                    <FormField label="Graduation Year" id="graduationYear" value={academicBackground.graduationYear} required={true} 
                        onChange={(id, v) => handleChange('academicBackground', id, v)}
                    >
                        <select className="form-field" id="graduationYear" value={academicBackground.graduationYear} required 
                            onChange={(e) => handleChange('academicBackground', 'graduationYear', e.target.value)}>
                            <option value="">Select year</option>
                            {[2024, 2023, 2022, 2021, 2020].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </FormField>
                    <FormField label="GPA (out of 4.0)" id="gpa" type="number" value={academicBackground.gpa} required={true} 
                        onChange={(id, v) => handleChange('academicBackground', id, v)}
                        placeholder="4.0" min="0" max="4" step="0.01" 
                    />
                    <FormField label="SAT Score (Optional)" id="satScore" type="number" value={academicBackground.satScore} required={false} 
                        onChange={(id, v) => handleChange('academicBackground', id, v)}
                        placeholder="1600" min="400" max="1600" 
                    />
                </div>
            </div>

            <div className="form-section">
                <h3 className="section-title">Program Selection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField label="Intended Major" id="intendedMajor" value={programSelection.intendedMajor} required={true} 
                        onChange={(id, v) => handleChange('programSelection', id, v)}
                    >
                        <select className="form-field" id="intendedMajor" value={programSelection.intendedMajor} required 
                            onChange={(e) => handleChange('programSelection', 'intendedMajor', e.target.value)}>
                            <option value="">Select major</option>
                            <option value="computer-science">Computer Science</option>
                            <option value="engineering">Engineering</option>
                            <option value="business">Business Administration</option>
                            <option value="psychology">Psychology</option>
                            <option value="biology">Biology</option>
                            <option value="other">Other</option>
                        </select>
                    </FormField>
                    <FormField label="Admission Term" id="admissionTerm" value={programSelection.admissionTerm} required={true} 
                        onChange={(id, v) => handleChange('programSelection', id, v)}
                    >
                        <select className="form-field" id="admissionTerm" value={programSelection.admissionTerm} required 
                            onChange={(e) => handleChange('programSelection', 'admissionTerm', e.target.value)}>
                            <option value="">Select term</option>
                            <option value="fall-2024">Fall 2024</option>
                            <option value="spring-2025">Spring 2025</option>
                            <option value="summer-2025">Summer 2025</option>
                        </select>
                    </FormField>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <button className="btn-secondary" onClick={previousTab}>Previous</button>
                <button className="btn-primary" onClick={nextTab}>Continue to Documents</button>
            </div>
        </div>
    );
}

const Documents = ({ formData, updateFile, nextTab, previousTab }) => {
    const { documents } = formData;

    const handleFileChange = (id, e) => {
        const file = e.target.files.length > 0 ? e.target.files[0] : null;
        updateFile(id, file);
    };

    const handleMultiFileChange = (id, e) => {
        const files = Array.from(e.target.files);
        updateFile(id, files);
    };

    const getFileName = (fileData) => {
        if (Array.isArray(fileData)) {
            return fileData.length > 0 ? `${fileData.length} file(s) selected` : '';
        }
        return fileData?.name || '';
    };

    return (
        <div id="documents" className="tab-content">
            <div className="form-section">
                <h3 className="section-title">Required Documents</h3>
                <div className="space-y-6">
                    <FormField label="Official Transcript" id="transcript" required={true}>
                        <input type="file" className="form-field" id="transcript" accept=".pdf,.doc,.docx" required 
                            onChange={(e) => handleFileChange('transcript', e)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {documents.transcript ? `File: ${documents.transcript.name}` : 'Upload your official high school transcript (PDF, DOC, or DOCX)'}
                        </p>
                    </FormField>

                    <FormField label="Personal Statement" id="personalStatement" required={true}>
                        <input type="file" className="form-field" id="personalStatement" accept=".pdf,.doc,.docx" required
                            onChange={(e) => handleFileChange('personalStatement', e)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {documents.personalStatement ? `File: ${documents.personalStatement.name}` : 'Upload your personal statement or essay (PDF, DOC, or DOCX)'}
                        </p>
                    </FormField>

                    <FormField label="Letters of Recommendation" id="recommendationLetters" required={false}>
                        <input type="file" className="form-field" id="recommendationLetters" accept=".pdf,.doc,.docx" multiple
                            onChange={(e) => handleMultiFileChange('recommendationLetters', e)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {getFileName(documents.recommendationLetters) || 'Upload 1-3 letters of recommendation (PDF, DOC, or DOCX)'}
                        </p>
                    </FormField>

                    <FormField label="Additional Documents" id="additionalDocuments" required={false}>
                        <input type="file" className="form-field" id="additionalDocuments" accept=".pdf,.doc,.docx,.jpg,.png" multiple
                            onChange={(e) => handleMultiFileChange('additionalDocuments', e)}
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            {getFileName(documents.additionalDocuments) || 'Any additional supporting documents (certificates, awards, etc.)'}
                        </p>
                    </FormField>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <button className="btn-secondary" onClick={previousTab}>Previous</button>
                <button className="btn-primary" onClick={nextTab}>Continue to Review</button>
            </div>
        </div>
    );
}

const ApplicationSummary = ({ formData }) => {
    const { personalInfo, contactInfo, academicBackground, programSelection, documents } = formData;
    
    const getFileStatus = (fileData) => (
        (Array.isArray(fileData) && fileData.length > 0) || (!Array.isArray(fileData) && fileData) 
            ? 'Uploaded ✅' : 'Missing ❌'
    );
    
    const summaryHTML = useMemo(() => {
        return `
            <h4 class="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Personal & Contact Information</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
                <div><strong class="font-medium">Name:</strong> ${personalInfo.firstName} ${personalInfo.lastName}</div>
                <div><strong class="font-medium">Date of Birth:</strong> ${personalInfo.dateOfBirth}</div>
                <div><strong class="font-medium">Gender:</strong> ${personalInfo.gender}</div>
                <div><strong class="font-medium">Email:</strong> ${contactInfo.email}</div>
                <div><strong class="font-medium">Phone:</strong> ${contactInfo.phone}</div>
                <div><strong class="font-medium">Country:</strong> ${contactInfo.country}</div>
                <div><strong class="font-medium">State:</strong> ${contactInfo.stateProvince}</div>
                <div><strong class="font-medium">Address:</strong> ${contactInfo.address}, ${contactInfo.city} ${contactInfo.zipPostalCode}</div>
            </div>

            <h4 class="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Academic Background</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 mb-4 text-sm">
                <div><strong class="font-medium">High School:</strong> ${academicBackground.highSchoolName}</div>
                <div><strong class="font-medium">Graduation Year:</strong> ${academicBackground.graduationYear}</div>
                <div><strong class="font-medium">GPA:</strong> ${academicBackground.gpa}</div>
                <div><strong class="font-medium">SAT Score:</strong> ${academicBackground.satScore || 'N/A'}</div>
                <div><strong class="font-medium">Intended Major:</strong> ${programSelection.intendedMajor}</div>
                <div><strong class="font-medium">Admission Term:</strong> ${programSelection.admissionTerm}</div>
            </div>
            
            <h4 class="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Documents</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div><strong class="font-medium">Transcript:</strong> ${getFileStatus(documents.transcript)}</div>
                <div><strong class="font-medium">Personal Statement:</strong> ${getFileStatus(documents.personalStatement)}</div>
                <div><strong class="font-medium">Letters of Recommendation:</strong> ${getFileStatus(documents.recommendationLetters)}</div>
                <div><strong class="font-medium">Additional Documents:</strong> ${getFileStatus(documents.additionalDocuments)}</div>
            </div>
        `;
    }, [formData]);

    return (
        <div id="applicationSummary" className="border rounded-lg p-4 bg-gray-50 mb-6 shadow-inner"
             dangerouslySetInnerHTML={{ __html: summaryHTML }} 
        />
    );
};


const ReviewSubmit = ({ formData, submitApplication, previousTab, onApplicationComplete }) => {
    return (
        <div id="review" className="tab-content">
            <div id="review-container" className="form-section">
                <h3 className="section-title">Application Review</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 Review Your Information</h4>
                    <p className="text-blue-700">Please review all the information you've provided before submitting your application. You can go back to any previous section to make changes.</p>
                </div>
                
                <ApplicationSummary formData={formData} />

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notice</h4>
                    <p className="text-yellow-700">Once you submit your application, you will not be able to make changes. Please ensure all information is accurate and complete.</p>
                </div>
            </div>

            <div className="flex justify-between items-center mt-8">
                <button className="btn-secondary" onClick={previousTab}>Previous</button>
                <button className="btn-primary" id="submitButton" onClick={submitApplication}>Submit Application</button>
            </div>
        </div>
    );
}

// --- 4. APPLICATION FORM WRAPPER ---

const initialFormData = {
    personalInfo: { firstName: '', lastName: '', dateOfBirth: '', gender: '', },
    contactInfo: { email: '', phone: '', address: '', city: '', stateProvince: '', zipPostalCode: '', country: '', },
    academicBackground: { highSchoolName: '', graduationYear: '', gpa: '', satScore: '', },
    programSelection: { intendedMajor: '', admissionTerm: '', },
    documents: { 
        transcript: null, 
        personalStatement: null, 
        recommendationLetters: [], 
        additionalDocuments: [],
    }
};

const ApplicationForm = ({ onApplicationComplete }) => { 
    const [formData, setFormData] = useState(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [warningsEnabled, setWarningsEnabled] = useState(false);
    const [tabValidity, setTabValidity] = useState({ 1: false, 2: false, 3: false, 4: false });

    // Function to update form data
    const updateFormData = useCallback((section, data) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                ...data
            }
        }));
    }, []);

    // Function to update file data
    const updateFile = useCallback((fileId, fileData) => {
        setFormData(prev => ({
            ...prev,
            documents: {
                ...prev.documents,
                [fileId]: fileData,
            }
        }));
    }, []);

    // Function to check and update the warning status of all tabs
    const updateTabWarnings = useCallback(() => {
        if (!warningsEnabled) return;
        
        const newValidity = {};
        for (let step = 1; step < totalSteps; step++) { // Only validate steps 1-3
            newValidity[step] = validateStep(step, formData);
        }
        setTabValidity(newValidity);
    }, [warningsEnabled, formData]);

    // Effect to run validation on form data change
    useEffect(() => {
        updateTabWarnings();
    }, [formData, updateTabWarnings]);

    const showTabByName = useCallback((tabName) => {
        setCurrentStep(getStepByTabName(tabName));
    }, []);

    const nextTab = () => {
        if (currentStep === 1) {
            setWarningsEnabled(true);
        }
        
        if (!validateStep(currentStep, formData)) {
            // Using a simple alert for immediate feedback on validation failure
            alert('Please fill out all required fields in the current section before continuing.'); 
            return;
        }

        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const previousTab = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const submitApplication = async () => {
        let isFormComplete = true;
        for (let i = 1; i < totalSteps; i++) {
            if (!validateStep(i, formData)) {
                isFormComplete = false;
                break;
            }
        }
        
        if (!isFormComplete) {
            alert('Please ensure all required fields in all sections are filled before submitting.');
            setWarningsEnabled(true); 
            updateTabWarnings();
            return;
        }

        const submissionData = {
            ...formData,
            academicBackground: {
                ...formData.academicBackground,
                graduationYear: parseInt(formData.academicBackground.graduationYear) || undefined,
                gpa: parseFloat(formData.academicBackground.gpa) || undefined,
                satScore: formData.academicBackground.satScore ? parseInt(formData.academicBackground.satScore) : undefined,
            },
            documents: {
                isTranscriptUploaded: !!formData.documents.transcript,
                isStatementUploaded: !!formData.documents.personalStatement,
                recommendationLettersCount: formData.documents.recommendationLetters.length,
                additionalDocumentsCount: formData.documents.additionalDocuments.length,
            }
        };

        const reviewContent = document.getElementById('review-container');

        if (reviewContent) {
            reviewContent.innerHTML = `<div class="text-center py-12"><p class="text-blue-600 font-semibold">Submitting application to the mock server...</p></div>`;
        }

        try {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            // Mocking the server response since there is no actual backend
            const mockResponse = {
                ok: true,
                status: 200,
                json: async () => ({
                    applicationId: 'UNI-' + Math.floor(Math.random() * 90000 + 10000),
                    message: 'Success',
                }),
            };
            
            const response = mockResponse;
            const result = await response.json();
            
            if (response.ok) { 
                reviewContent.innerHTML = `
                    <div class="text-center py-12">
                        <div class="success-message">
                            <h3 class="text-2xl font-bold mb-2 text-green-600">🎉 Application Submitted Successfully!</h3>
                            <p class="text-lg text-gray-700">Thank you for your application. You will receive a confirmation email shortly.</p>
                            <p class="mt-4 text-sm opacity-90 text-gray-500">Application ID: ${result.applicationId || 'N/A'}</p>
                        </div>
                        <div class="mt-8">
                            <button class="btn-primary" onclick="window.location.reload()">Submit Another Application</button>
                        </div>
                    </div>
                `;
                // Call the prop to notify the parent App component to navigate home
                onApplicationComplete();

            } else { 
                // Display mock error message
                reviewContent.innerHTML = `
                    <div class="text-center py-12">
                        <div class="error-message">
                            <h3 class="text-2xl font-bold mb-2 text-red-600">❌ Application Submission Failed!</h3>
                            <p class="text-lg text-red-500">Validation failed or server connection issue.</p>
                            <p class="mt-4 text-sm opacity-90">Please ensure all required fields are corrected.</p>
                        </div>
                        <div class="mt-8">
                            <button class="btn-primary" onclick="window.location.reload()">Start Over</button>                
                        </div>
                    </div>
                `;
                setWarningsEnabled(true);
            }

        } catch (error) {
            console.error('Network or server connection error:', error);
             reviewContent.innerHTML = `
                <div class="text-center py-12">
                    <div class="error-message">
                        <h3 class="text-2xl font-bold mb-2 text-red-600">❌ Network Error!</h3>
                        <p class="text-lg text-red-500">Could not connect to the server. Please check your internet connection.</p>
                    </div>
                    <div class="mt-8">
                        <button class="btn-primary" onclick="window.location.reload()">Try Again</button>
                    </div>
                </div>
            `;
        }
    };

    const currentTabName = getTabNameByStep(currentStep);

    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-white mb-2">College Admission Form</h1>
                <p className="text-blue-100 text-lg">Complete your application in simple steps</p>
            </div>
            
            <TabNavigation 
                currentStep={currentStep} 
                tabValidity={tabValidity}
                onTabClick={showTabByName} 
                warningsEnabled={warningsEnabled}
            />
            
            <br /><br />

            <div className="main-card p-8" id="form-content-area">
                {currentTabName === 'personal' && (
                    <PersonalInformation 
                        formData={formData} 
                        updateFormData={updateFormData} 
                        nextTab={nextTab} 
                        previousTab={previousTab}
                    />
                )}
                
                {currentTabName === 'academic' && (
                    <AcademicBackground 
                        formData={formData} 
                        updateFormData={updateFormData} 
                        nextTab={nextTab} 
                        previousTab={previousTab}
                    />
                )}
                
                {currentTabName === 'documents' && (
                    <Documents 
                        formData={formData} 
                        updateFile={updateFile} 
                        nextTab={nextTab} 
                        previousTab={previousTab}
                    />
                )}
                
                {currentTabName === 'review' && (
                    <ReviewSubmit
                        formData={formData}
                        submitApplication={submitApplication}
                        previousTab={previousTab}
                        onApplicationComplete={onApplicationComplete}
                    />
                )}
            </div>
        </div>
    );
}

// --- 5. HOME PAGE COMPONENT ---

const HomePage = ({ navigate }) => {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="max-w-4xl mx-auto bg-white bg-opacity-95 p-10 md:p-16 rounded-3xl shadow-2xl backdrop-blur-md border border-indigo-100">
                <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                    Your Future Starts <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Here.</span>
                </h2>
                <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
                    Welcome to the University Admission Portal. We offer a streamlined, four-step application process designed for simplicity and efficiency.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                    {[
                        { num: 1, title: "Personal Info", desc: "Basic and contact details." },
                        { num: 2, title: "Academics", desc: "School, GPA, and scores." },
                        { num: 3, title: "Documents", desc: "Upload transcripts and essays." },
                        { num: 4, title: "Submit", desc: "Final review and application." }
                    ].map(step => (
                        <div key={step.num} className="p-4 bg-indigo-50 rounded-xl shadow-lg transition-transform hover:scale-105 border-b-4 border-indigo-300">
                            <div className="text-3xl font-bold text-indigo-600 mb-2">{step.num}</div>
                            <h3 className="text-lg font-semibold text-gray-800">{step.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{step.desc}</p>
                        </div>
                    ))}
                </div>

                <button
                    className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-xl font-bold rounded-full shadow-lg 
                               text-white bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 
                               transition-all duration-300 transform hover:scale-105"
                    onClick={() => navigate('form')}
                >
                    Start Your Application Now &rarr;
                </button>

                <p className="mt-8 text-sm text-gray-400">
                    Need help? Review our admission guidelines before you start.
                </p>
            </div>
        </div>
    );
}

// --- 6. NAVBAR COMPONENT ---

const Navbar = ({ currentPage, navigate }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navItems = [
        { name: 'Home', page: 'home', icon: Home },
        { name: 'Apply Now', page: 'form', icon: FileText },
    ];

    const logo = "UniPortal"; 

    return (
        <header className="fixed top-0 left-0 right-0 z-20 bg-gray-900 bg-opacity-90 backdrop-blur-sm shadow-xl">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo/Brand */}
                    <div className="flex-shrink-0">
                        <button className="flex items-center text-2xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors" onClick={() => navigate('home')}>
                            <span className="text-indigo-400 mr-2">🎓</span> {logo}
                        </button>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                className={`flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg 
                                    ${currentPage === item.page 
                                        ? 'text-indigo-400 border-b-2 border-indigo-400' 
                                        : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
                                    }`}
                                onClick={() => navigate(item.page)}
                            >
                                <item.icon className="w-4 h-4 mr-1" />
                                {item.name}
                            </button>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            aria-expanded={isMenuOpen}
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Panel */}
            {isMenuOpen && (
                <div className="md:hidden bg-gray-800 bg-opacity-95 transition-all duration-300 ease-in-out">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => (
                            <button
                                key={item.name}
                                className={`w-full text-left flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors
                                    ${currentPage === item.page 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                                    }`}
                                onClick={() => { navigate(item.page); setIsMenuOpen(false); }}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </header>
    );
}


// --- 7. MAIN APP COMPONENT (The Entry Point) ---

const AppStyles = () => (
    <style jsx="true">{`
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #2d3748;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .main-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08);
        }

        .form-field {
            width: 100%;
            padding: 0.75rem 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            font-size: 1rem;
            line-height: 1.5;
            transition: all 0.2s;
            background-color: #ffffff;
        }

        .form-field:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.5);
        }

        .field-label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #4a5568;
        }

        /* Tabs */
        .tab {
            padding: 0.75rem 0.5rem;
            background: transparent;
            border: none;
            cursor: pointer;
            font-weight: 600;
            color: #718096;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .tab:not([disabled]):hover {
            color: #4a5568;
        }

        .tab.active {
            color: #667eea;
            border-bottom: 3px solid #667eea;
        }

        .tab[disabled] {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .tab-warning {
            position: absolute;
            top: 5px;
            right: 5px;
            background: #f56565;
            color: white;
            width: 15px;
            height: 15px;
            border-radius: 50%;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            padding-top: 1px;
        }

        .tab.needs-attention {
            color: #dd6b20; /* Orange-red for attention */
        }

        /* Buttons */
        .btn-primary {
            padding: 0.75rem 1.5rem;
            background-color: #667eea;
            color: white;
            font-weight: 600;
            border-radius: 0.5rem;
            transition: background-color 0.2s, transform 0.1s;
        }

        .btn-primary:hover {
            background-color: #556ee6;
            transform: translateY(-1px);
        }

        .btn-secondary {
            padding: 0.75rem 1.5rem;
            background-color: #e2e8f0;
            color: #4a5568;
            font-weight: 600;
            border-radius: 0.5rem;
            transition: background-color 0.2s;
        }

        .btn-secondary:hover {
            background-color: #cbd5e0;
        }

        .required {
            color: #e53e3e;
            margin-left: 2px;
        }

        .form-section {
            margin-bottom: 2rem;
            padding: 1.5rem;
            border-radius: 0.5rem;
            background-color: #f7fafc;
            border: 1px solid #edf2f7;
            box-shadow: 0 1px 3px 0 rgba(0,0,0,.1);
        }

        .section-title {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: #3182ce;
            border-bottom: 2px solid #ebf8ff;
            padding-bottom: 0.5rem;
        }
    `}</style>
);

const FlatpickrCDN = () => (
    <>
        {/* Flatpickr CSS from CDN */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.css" />
        {/* Flatpickr JS from CDN (Must be loaded globally for the component to use it) */}
        <script src="https://cdn.jsdelivr.net/npm/flatpickr@4.6.13/dist/flatpickr.min.js"></script>
    </>
);


export default function App() {
    // State to manage which page is currently displayed: 'home' or 'form'
    const [currentPage, setCurrentPage] = useState('home');

    const navigate = useCallback((page) => {
        setCurrentPage(page);
    }, []);

    // Function to handle successful form submission and navigate home
    const handleApplicationComplete = useCallback(() => {
        // Set a small delay to allow the success message to be read
        setTimeout(() => {
            navigate('home');
        }, 3000); 
    }, [navigate]);

    return (
        <div className="min-h-screen flex flex-col">
            <AppStyles />
            <FlatpickrCDN /> {/* Include CDN assets here */}
            <Navbar currentPage={currentPage} navigate={navigate} />

            <main className="flex-grow pt-20 pb-8"> 
                {currentPage === 'home' && <HomePage navigate={navigate} />}
                
                {currentPage === 'form' && (
                    <div className="p-4">
                        <ApplicationForm onApplicationComplete={handleApplicationComplete} />
                    </div>
                )}
            </main>
            
            {/* Simple Footer */}
            <footer className="w-full text-center text-white text-sm py-4 bg-gray-900 bg-opacity-30 backdrop-blur-sm">
                &copy; {new Date().getFullYear()} University Admissions. All rights reserved.
            </footer>
        </div>
    );
}