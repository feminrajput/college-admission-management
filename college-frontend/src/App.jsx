import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, query, where } from 'firebase/firestore';

// --- Global Setup (Required by the environment) ---
// These variables are provided by the hosting environment for Firebase configuration
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const Loader = () => (
    <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
        <div className="ml-3 text-indigo-700 font-medium">Loading application data...</div>
    </div>
);

const SectionCard = ({ title, children }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
        <h3 className="text-xl font-bold mb-4 text-indigo-800 border-b pb-2">{title}</h3>
        {children}
    </div>
);

const InputField = ({ label, id, type = 'text', value, onChange, placeholder = '', required = false, options = [], disabled = false }) => (
    <div className="mb-4">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === 'select' ? (
            <select
                id={id}
                name={id}
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-gray-50 disabled:opacity-50"
                required={required}
                disabled={disabled}
            >
                <option value="" disabled>{placeholder || `Select ${label}`}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        ) : type === 'textarea' ? (
            <textarea
                id={id}
                name={id}
                rows="4"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-gray-50 resize-none disabled:opacity-50"
                placeholder={placeholder}
                required={required}
                disabled={disabled}
            />
        ) : (
            <input
                id={id}
                name={id}
                type={type}
                value={value || ''}
                onChange={(e) => onChange(type === 'file' ? e.target.files[0] : e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 ease-in-out bg-gray-50 disabled:opacity-50"
                placeholder={placeholder}
                required={required}
                disabled={disabled}
            />
        )}
    </div>
);

const STEPS = [
    { id: 'personal', title: 'Personal Information' },
    { id: 'academic', title: 'Academic History' },
    { id: 'documents', title: 'Documents Upload' },
    { id: 'summary', title: 'Review & Submit' },
];

const INITIAL_DATA = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    zipPostalCode: '',
    // Academic
    highSchoolName: '',
    graduationYear: '',
    gpa: '',
    satScore: '',
    intendedMajor: '',
    admissionTerm: 'Fall 2025',
    // Documents (using placeholders for file names/status)
    transcript: null, 
    personalStatement: null, 
};

// --- Firebase Context and Setup ---

const useFirebase = () => {
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            if (Object.keys(firebaseConfig).length === 0) {
                 // We don't throw, just log and continue, as the environment may inject config later
                 console.warn("Firebase configuration is missing, using mock/in-memory data.");
            }

            const app = initializeApp(firebaseConfig);
            const firestoreDb = getFirestore(app);
            const firebaseAuth = getAuth(app);

            setDb(firestoreDb);
            setAuth(firebaseAuth);

            const authenticate = async () => {
                if (initialAuthToken) {
                    await signInWithCustomToken(firebaseAuth, initialAuthToken);
                } else {
                    await signInAnonymously(firebaseAuth);
                }
            };

            // Set up listener for auth state changes
            const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
                // Use the Firebase UID if available, otherwise generate a random UUID for anonymous users
                const currentId = user ? user.uid : crypto.randomUUID(); 
                setUserId(currentId);
                setIsAuthReady(true);
            });

            authenticate().catch(e => {
                console.error("Authentication Error:", e);
                setError("Failed to initialize authentication.");
                setIsAuthReady(true);
            });

            return () => unsubscribe();
        } catch (e) {
            console.error("Firebase Initialization Error:", e);
            setError("Firebase initialization failed. Check your configuration or console.");
            setIsAuthReady(true);
        }
    }, []);

    return { db, auth, userId, isAuthReady, error };
};

// --- Main Application Component ---

const App = () => {
    const { db, userId, isAuthReady, error } = useFirebase();
    const [formData, setFormData] = useState(INITIAL_DATA);
    const [currentStep, setCurrentStep] = useState(STEPS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState(null);

    // Document Path Helper
    const getDocRef = useCallback(() => {
        if (db && userId) {
            // Path: /artifacts/{appId}/users/{userId}/admissions/applicationForm
            return doc(db, 'artifacts', appId, 'users', userId, 'admissions', 'applicationForm');
        }
        return null;
    }, [db, userId]);

    // 1. Data Loading (onSnapshot)
    useEffect(() => {
        if (!db || !userId || !isAuthReady) return;

        const docRef = getDocRef();
        if (!docRef) return;

        console.log(`Listening to path: artifacts/${appId}/users/${userId}/admissions/applicationForm`);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                console.log("Data loaded from Firestore:", docSnap.data());
                setFormData((prev) => ({ ...prev, ...docSnap.data() }));
            } else {
                console.log("No data found, using initial state.");
            }
        }, (err) => {
            console.error("Error fetching document:", err);
            setSaveMessage({ type: 'error', text: 'Failed to load application data.' });
        });

        return () => unsubscribe();
    }, [db, userId, isAuthReady, getDocRef]);

    // Helper for input changes
    const handleChange = (id, value) => {
        setFormData((prev) => ({ ...prev, [id]: value }));
        // Autosave is triggered by the effect below
    };

    // 2. Data Saving (Autosave Effect)
    useEffect(() => {
        if (!db || !userId || !isAuthReady) return;

        const docRef = getDocRef();
        if (!docRef) return;

        const delaySave = setTimeout(async () => {
            if (isSaving) return; // Prevent saving if already in progress

            setIsSaving(true);
            setSaveMessage({ type: 'info', text: 'Saving changes...' });

            try {
                // Use setDoc with merge: true to avoid overwriting the whole document
                await setDoc(docRef, formData, { merge: true });
                console.log("Application data saved successfully.");
                setSaveMessage({ type: 'success', text: 'All changes saved to the cloud.' });
            } catch (e) {
                console.error("Error saving document:", e);
                setSaveMessage({ type: 'error', text: 'Failed to save changes.' });
            } finally {
                setIsSaving(false);
                setTimeout(() => setSaveMessage(null), 3000); // Clear message after 3s
            }
        }, 1000); // Debounce time of 1 second

        return () => clearTimeout(delaySave);
    }, [formData, getDocRef, db, userId, isAuthReady]); // Dependency array: save whenever formData changes

    const currentStepIndex = useMemo(() => STEPS.findIndex(step => step.id === currentStep), [currentStep]);
    const totalSteps = STEPS.length;
    const progress = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

    const handleNext = () => {
        if (currentStepIndex < totalSteps - 1) {
            setCurrentStep(STEPS[currentStepIndex + 1].id);
            window.scrollTo(0, 0);
        }
    };

    const handlePrev = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(STEPS[currentStepIndex - 1].id);
            window.scrollTo(0, 0);
        }
    };

    // Validation check for mandatory fields before proceeding (Simple example)
    const isStepValid = useMemo(() => {
        if (currentStep === 'personal') {
            return formData.firstName && formData.lastName && formData.email && formData.dateOfBirth;
        }
        if (currentStep === 'academic') {
            return formData.highSchoolName && formData.graduationYear && formData.gpa && formData.intendedMajor;
        }
        // Documents and Summary steps are assumed valid for this simple demo
        return true;
    }, [currentStep, formData]);

    const handleFileUpload = (fieldId) => {
        // In a real application, this would trigger an actual file upload to Firebase Storage,
        // and then update the formData with the file URL/metadata.
        // Here, we simulate the 'Upload' action.
        handleChange(fieldId, 'Uploaded');
        setSaveMessage({ type: 'info', text: `${fieldId} simulated as uploaded.` });
        setTimeout(() => setSaveMessage(null), 2000);
    };

    const handleFinalSubmit = () => {
        setSaveMessage({ type: 'success', text: 'Application submitted successfully! (Simulated)' });
        console.log("Final Submission Data:", formData);
        // In a real app, this would change a 'status' field in Firestore
    };

    // Render Logic based on current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 'personal':
                return (
                    <SectionCard title="Personal Information">
                        <div className="grid md:grid-cols-2 gap-6">
                            <InputField label="First Name" id="firstName" value={formData.firstName} onChange={(val) => handleChange('firstName', val)} required />
                            <InputField label="Last Name" id="lastName" value={formData.lastName} onChange={(val) => handleChange('lastName', val)} required />
                            <InputField label="Email Address" id="email" type="email" value={formData.email} onChange={(val) => handleChange('email', val)} required />
                            <InputField label="Phone Number" id="phone" type="tel" value={formData.phone} onChange={(val) => handleChange('phone', val)} placeholder="e.g., (555) 555-5555" />
                            <InputField label="Date of Birth" id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={(val) => handleChange('dateOfBirth', val)} required />
                            <div className="md:col-span-2">
                                <InputField label="Street Address" id="address" value={formData.address} onChange={(val) => handleChange('address', val)} />
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <InputField label="City" id="city" value={formData.city} onChange={(val) => handleChange('city', val)} />
                                    <InputField label="Zip/Postal Code" id="zipPostalCode" value={formData.zipPostalCode} onChange={(val) => handleChange('zipPostalCode', val)} />
                                </div>
                            </div>
                        </div>
                    </SectionCard>
                );
            case 'academic':
                return (
                    <SectionCard title="Academic History">
                        <div className="grid md:grid-cols-2 gap-6">
                            <InputField label="High School Name" id="highSchoolName" value={formData.highSchoolName} onChange={(val) => handleChange('highSchoolName', val)} required />
                            <InputField label="Graduation Year" id="graduationYear" type="number" value={formData.graduationYear} onChange={(val) => handleChange('graduationYear', val)} required placeholder="e.g., 2025" />
                            <InputField label="GPA (out of 4.0)" id="gpa" type="number" value={formData.gpa} onChange={(val) => handleChange('gpa', val)} required placeholder="e.g., 3.8" />
                            <InputField label="SAT Score (Optional)" id="satScore" type="number" value={formData.satScore} onChange={(val) => handleChange('satScore', val)} placeholder="e.g., 1450" />
                            <InputField
                                label="Intended Major"
                                id="intendedMajor"
                                type="select"
                                value={formData.intendedMajor}
                                onChange={(val) => handleChange('intendedMajor', val)}
                                required
                                options={[
                                    { value: 'cs', label: 'Computer Science' },
                                    { value: 'eng', label: 'Mechanical Engineering' },
                                    { value: 'art', label: 'Liberal Arts' },
                                ]}
                            />
                            <InputField
                                label="Admission Term"
                                id="admissionTerm"
                                type="select"
                                value={formData.admissionTerm}
                                onChange={(val) => handleChange('admissionTerm', val)}
                                options={[
                                    { value: 'Fall 2025', label: 'Fall 2025' },
                                    { value: 'Spring 2026', label: 'Spring 2026' },
                                ]}
                                disabled
                            />
                        </div>
                    </SectionCard>
                );
            case 'documents':
                return (
                    <SectionCard title="Document Uploads">
                        <p className="mb-6 text-gray-600">
                            Please provide your official transcript and personal statement. **Note:** In this demo, files are not actually stored; we are simulating the upload status.
                        </p>
                        <div className="grid md:grid-cols-2 gap-6">
                            {['transcript', 'personalStatement'].map((fieldId) => (
                                <div key={fieldId} className="border p-4 rounded-lg flex justify-between items-center bg-gray-50">
                                    <div>
                                        <div className="font-semibold capitalize">{fieldId.replace(/([A-Z])/g, ' $1')}</div>
                                        <div className={`text-sm ${formData[fieldId] === 'Uploaded' ? 'text-green-600' : 'text-yellow-600'}`}>
                                            Status: **{formData[fieldId] || 'Pending'}**
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleFileUpload(fieldId)}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg transition duration-150 ${formData[fieldId] === 'Uploaded'
                                            ? 'bg-gray-300 text-gray-700 cursor-not-allowed'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg'
                                            }`}
                                        disabled={formData[fieldId] === 'Uploaded'}
                                    >
                                        {formData[fieldId] === 'Uploaded' ? 'Uploaded' : 'Simulate Upload'}
                                    </button>
                                </div>
                            ))}
                            <div className="md:col-span-2">
                                <InputField
                                    label="Personal Statement (Essay Content)"
                                    id="essay"
                                    type="textarea"
                                    value={formData.essay || ''}
                                    onChange={(val) => handleChange('essay', val)}
                                    placeholder="Write your personal statement here. Max 500 words."
                                />
                            </div>
                        </div>
                    </SectionCard>
                );
            case 'summary':
                const getFileStatus = (field) => formData[field] || 'Pending';
                const getValue = (field) => formData[field] || 'Not Provided';

                return (
                    <SectionCard title="Review and Submit">
                        <div className="text-sm text-gray-600 mb-6">
                            Review your information below. All data is automatically saved. When ready, click "Submit Application."
                        </div>

                        <h4 className="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Personal Information</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mb-4 text-sm">
                            <div><strong className="font-medium">Name:</strong> {getValue('firstName')} {getValue('lastName')}</div>
                            <div><strong className="font-medium">Email:</strong> {getValue('email')}</div>
                            <div><strong className="font-medium">Phone:</strong> {getValue('phone')}</div>
                            <div><strong className="font-medium">DOB:</strong> {getValue('dateOfBirth')}</div>
                            <div className="md:col-span-2"><strong className="font-medium">Address:</strong> {getValue('address')}, {getValue('city')} {getValue('zipPostalCode')}</div>
                        </div>

                        <h4 className="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Academic Background</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mb-4 text-sm">
                            <div><strong className="font-medium">High School:</strong> {getValue('highSchoolName')}</div>
                            <div><strong className="font-medium">Graduation Year:</strong> {getValue('graduationYear')}</div>
                            <div><strong className="font-medium">GPA:</strong> {getValue('gpa')}</div>
                            <div><strong className="font-medium">SAT Score:</strong> {getValue('satScore') || 'N/A'}</div>
                            <div><strong className="font-medium">Intended Major:</strong> {getValue('intendedMajor')}</div>
                            <div><strong className="font-medium">Admission Term:</strong> {getValue('admissionTerm')}</div>
                        </div>

                        <h4 className="text-lg font-bold mb-3 border-b pb-1 text-indigo-700">Documents</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            <div><strong className="font-medium">Transcript:</strong> {getFileStatus('transcript')}</div>
                            <div><strong className="font-medium">Personal Statement:</strong> {getFileStatus('personalStatement')}</div>
                        </div>

                        {formData.essay && (
                            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                                <h5 className="font-bold mb-2 text-md text-indigo-700">Personal Statement Preview</h5>
                                <p className="text-gray-700 italic whitespace-pre-wrap">{formData.essay.substring(0, 300)}...</p>
                                <p className="text-right text-xs text-gray-500 mt-2">(Full statement available upon submission)</p>
                            </div>
                        )}

                        <div className="mt-8 pt-4 border-t flex justify-between items-center">
                            <div className="text-sm font-semibold">
                                Ready to submit?
                            </div>
                            <button
                                onClick={handleFinalSubmit}
                                className="bg-green-600 text-white px-8 py-3 text-lg font-semibold rounded-lg shadow-xl hover:bg-green-700 transition duration-300 transform hover:scale-[1.02]"
                            >
                                Submit Application
                            </button>
                        </div>
                    </SectionCard>
                );
            default:
                return <p className="p-6">Invalid Step</p>;
        }
    };

    if (error) {
        return (
            <div className="p-10 text-center bg-red-100 border-l-4 border-red-500 text-red-700">
                <p className="font-bold">Initialization Error</p>
                <p>{error}</p>
                <p className="text-sm mt-2">Check the console for details and ensure Firebase configuration is available.</p>
            </div>
        );
    }

    if (!isAuthReady) {
        return <Loader />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Tailwind is assumed available in React environment */}
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white rounded-xl shadow-2xl p-6 md:p-10 border-t-4 border-indigo-600">
                    <div className="flex justify-between items-start mb-8 border-b pb-4">
                        <h1 className="text-3xl font-extrabold text-gray-800">
                            University Admission Application
                        </h1>
                        <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded-lg">
                            User ID: {userId}
                            <br/>
                            App ID: {appId}
                        </div>
                    </div>

                    {/* Progress Bar & Steps */}
                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-medium mb-2">
                            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
                            <span>{progress}% Complete</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                                className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-4">
                            {STEPS.map((step, index) => (
                                <button
                                    key={step.id}
                                    onClick={() => setCurrentStep(step.id)}
                                    className={`text-xs sm:text-sm font-semibold p-2 rounded-lg transition duration-200 ${index <= currentStepIndex
                                        ? 'text-indigo-700 border-b-2 border-indigo-500'
                                        : 'text-gray-500 hover:text-indigo-500'
                                        }`}
                                >
                                    {index + 1}. {step.title}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Save Message */}
                    {saveMessage && (
                        <div className={`p-3 mb-6 rounded-lg font-medium text-sm transition-opacity duration-300 ${saveMessage.type === 'success' ? 'bg-green-100 text-green-700' : saveMessage.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                            {saveMessage.text}
                        </div>
                    )}

                    {/* Step Content */}
                    {renderStepContent()}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-4 border-t">
                        <button
                            onClick={handlePrev}
                            disabled={currentStepIndex === 0}
                            className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ${currentStepIndex === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                }`}
                        >
                            &larr; Previous Step
                        </button>
                        <button
                            onClick={handleNext}
                            disabled={currentStepIndex === totalSteps - 1 || !isStepValid}
                            className={`px-6 py-3 rounded-lg font-semibold transition duration-300 ${currentStepIndex === totalSteps - 1 || !isStepValid
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                                }`}
                        >
                            {currentStepIndex === totalSteps - 2 ? 'Review & Submit' : 'Next Step \u2192'}
                        </button>
                    </div>

                    {!isStepValid && currentStepIndex < totalSteps - 1 && (
                        <div className="mt-4 text-center text-sm text-red-500">
                            Please fill in all required fields (*) to proceed to the next step.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;