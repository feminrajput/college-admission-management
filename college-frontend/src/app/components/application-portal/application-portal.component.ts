import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; // 1. Added ChangeDetectorRef
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApplicationService } from '../../services/application.service';
import { CollegeService, College } from '../../services/college.service';
import { environment } from '../../../environments/environment';
import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

@Component({
  selector: 'app-application-portal',
  imports: [CommonModule, FormsModule],
  templateUrl: './application-portal.component.html',
  styleUrl: './application-portal.component.css'
})
export class ApplicationPortalComponent implements OnInit {
  currentStep = 1;
  totalSteps = 4;
  warningsEnabled = false;
  submitting = false;

  // Colleges from API
  colleges: College[] = [];
  selectedCollegeCode = '';
  selectedCollegeName = '';
  availablePrograms: string[] = [];

  // Submission result state
  submissionResult: 'none' | 'success' | 'error' | 'duplicate' | 'validation-error' | 'duplicate-aadhar' = 'none';
  submissionAppId = '';
  submissionError = '';
  submissionEmail = '';
  existingAppId = '';
  validationErrors: string[] = [];
  validationHint = '';

  // Personal Information
  surname = '';
  firstName = '';
  fatherName = '';
  motherName = '';
  dateOfBirth = '';
  gender = '';
  aadharNumber = '';
  asyncAadharError = '';
  caste = '';
  category = ''; // General, SC, ST, SEBC, EWS
  email = '';
  phone = '';
  address = '';
  city = '';
  stateProvince = 'Gujarat';
  zipPostalCode = '';
  country = 'India';

  // Email OTP state
  emailOtpSent = false;
  emailVerified = false;
  emailOtp = '';
  emailOtpLoading = false;
  emailOtpError = '';

  // Phone OTP state
  phoneOtpSent = false;
  phoneVerified = false;
  phoneOtp = '';
  phoneOtpLoading = false;
  phoneOtpError = '';
  recaptchaVerifier: any;
  confirmationResult: any;

  // Academic Background - SSC (10th)
  sscBoard = '';
  sscPassingMonth = '';
  sscPassingYear = '';
  sscSeatNo = '';
  sscTotalMarks: number | null = null;
  sscObtainedMarks: number | null = null;

  // Academic Background - HSC (12th)
  hscStream = ''; // Science, Commerce, Arts
  hscBoard = '';
  hscPassingMonth = '';
  hscPassingYear = '';
  hscSeatNo = '';
  hscTotalMarks: number | null = null;
  hscObtainedMarks: number | null = null;

  intendedMajor = '';
  admissionTerm = 'Semester 1';

  // Documents
  photoFile: File | null = null;
  signatureFile: File | null = null;
  aadharCardFile: File | null = null;
  marksheet10File: File | null = null;
  marksheet12File: File | null = null;
  leavingCertificateFile: File | null = null;
  casteCertificateFile: File | null = null;

  // Tab warning states
  tabWarnings: boolean[] = [false, false, false, false];
  visitedTabs: boolean[] = [false, false, false, false];

  // Minimum age
  readonly MINIMUM_AGE = 16;
  maxDateOfBirth = '';

  // Custom date picker
  calOpen = false;
  calYear = new Date().getFullYear() - 20;
  calMonth = new Date().getMonth(); // 0-indexed
  readonly MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  readonly DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Edit Mode state
  isEditMode = false;
  editAppId = '';
  editQueryMessage = '';

  // 2. Injected ChangeDetectorRef here
  constructor(
    private applicationService: ApplicationService,
    private collegeService: CollegeService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  // --- Calendar helpers ---

  /** The latest year a user can navigate to (must be >= 16 years old) */
  get maxCalYear(): number {
    return new Date().getFullYear() - this.MINIMUM_AGE;
  }

  /** The latest month in maxCalYear a user can navigate to */
  get maxCalMonth(): number {
    return new Date().getMonth();
  }

  get calDays(): (number | null)[] {
    const firstDay = new Date(this.calYear, this.calMonth, 1).getDay();
    const daysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  /** Returns true if the given day in the current calendar view is past the max allowed DOB */
  isDateDisabled(day: number | null): boolean {
    if (!day) return true;
    const cellDate = new Date(this.calYear, this.calMonth, day);
    const maxDate = new Date(this.maxCalYear, this.maxCalMonth, new Date().getDate());
    return cellDate > maxDate;
  }

  calSelectDay(day: number | null): void {
    if (!day || this.isDateDisabled(day)) return;
    const m = String(this.calMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    this.dateOfBirth = `${this.calYear}-${m}-${d}`;
    this.calOpen = false;
  }

  /** Called by the month <select> change event to ensure the value is always a number */
  onCalMonthChange(value: string | number): void {
    this.calMonth = +value;
    // If the newly selected month is beyond the allowed boundary, clamp the year
    if (this.calYear >= this.maxCalYear && this.calMonth > this.maxCalMonth) {
      this.calMonth = this.maxCalMonth;
    }
  }

  calPrevMonth(): void {
    if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; }
    else this.calMonth--;
  }

  calNextMonth(): void {
    // Block navigation beyond the max allowed date (16 years ago from today)
    if (this.calYear >= this.maxCalYear && this.calMonth >= this.maxCalMonth) return;
    if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; }
    else this.calMonth++;
  }

  get calDisplayDate(): string {
    if (!this.dateOfBirth) return 'Select date';
    const [y, m, d] = this.dateOfBirth.split('-');
    return `${d} ${this.MONTHS[+m - 1]} ${y}`;
  }

  isSelectedDay(day: number | null): boolean {
    if (!day || !this.dateOfBirth) return false;
    const [y, m, d] = this.dateOfBirth.split('-');
    return +y === this.calYear && +m - 1 === this.calMonth && +d === day;
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const t = new Date();
    return t.getFullYear() === this.calYear && t.getMonth() === this.calMonth && t.getDate() === day;
  }

  get todayYear(): number { return new Date().getFullYear(); }
  get todayMonth(): number { return new Date().getMonth(); }

  /** True when the next-month button should be hidden/disabled */
  get calNextDisabled(): boolean {
    return this.calYear >= this.maxCalYear && this.calMonth >= this.maxCalMonth;
  }
  // --- End Calendar helpers ---

  ngOnInit(): void {
    const app = initializeApp(environment.firebase);

    const today = new Date();
    const maxDate = new Date(today.getFullYear() - this.MINIMUM_AGE, today.getMonth(), today.getDate());
    this.maxDateOfBirth = maxDate.toISOString().split('T')[0];

    // Check if we are in Edit mode or preselecting college
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.isEditMode = true;
        this.editAppId = params['edit'];
        this.loadApplicationForEditing();
      } else if (params['college']) {
        this.selectedCollegeCode = params['college'];
        if (this.colleges.length > 0) {
          this.onCollegeChange();
        }
      }
    });

    // Load colleges
    this.collegeService.getColleges().subscribe({
      next: (res) => {
        if (res.success) {
          this.colleges = res.colleges;
          if (this.selectedCollegeCode && !this.isEditMode) {
            this.onCollegeChange();
          }
        }
        this.cdr.detectChanges(); // 3. Force update after colleges load
      },
      error: (err) => {
        console.error('Failed to load colleges', err);
        this.cdr.detectChanges(); // Ensure UI updates if loading fails too
      }
    });
  }

  loadApplicationForEditing(): void {
    this.applicationService.getApplicationById(this.editAppId).subscribe({
      next: (res) => {
        if (res.success && res.application) {
          const app = res.application;
          
          if (app.status !== 'Query Raised') {
            alert('Only applications with a "Query Raised" status can be edited.');
            this.router.navigate(['/status']);
            return;
          }

          this.editQueryMessage = app.queryMessage || '';

          const data = app.data;
          
          if (data) {
            // College selection
            this.selectedCollegeCode = data.collegeSelection?.collegeCode || '';
            this.selectedCollegeName = data.collegeSelection?.collegeName || '';
            
            // Program selection
            this.intendedMajor = data.programSelection?.intendedMajor || '';
            this.admissionTerm = data.programSelection?.admissionTerm || '';
            this.onCollegeChange(); // populate available programs
            this.intendedMajor = data.programSelection?.intendedMajor || ''; // re-set since onCollegeChange clears it

            // Personal Info
            this.surname = data.personalInfo?.surname || '';
            this.firstName = data.personalInfo?.firstName || '';
            this.fatherName = data.personalInfo?.fatherName || '';
            this.motherName = data.personalInfo?.motherName || '';
            this.dateOfBirth = data.personalInfo?.dateOfBirth || '';
            
            if (this.dateOfBirth) {
              const [y, m, d] = this.dateOfBirth.split('-');
              this.calYear = +y;
              this.calMonth = (+m) - 1;
            }

            this.gender = data.personalInfo?.gender || '';
            this.aadharNumber = data.personalInfo?.aadharNumber || '';
            this.caste = data.personalInfo?.caste || '';
            this.category = data.personalInfo?.category || '';

            // Contact Info
            this.email = data.contactInfo?.email || '';
            this.phone = data.contactInfo?.phone || '';
            this.emailVerified = true; // Already verified, auto-mark as verified
            this.phoneVerified = false; // Must re-verify phone number
            this.address = data.contactInfo?.address || '';
            this.city = data.contactInfo?.city || '';
            this.stateProvince = data.contactInfo?.stateProvince || 'Gujarat';
            this.zipPostalCode = data.contactInfo?.zipPostalCode || '';
            this.country = data.contactInfo?.country || 'India';

            // Academic Background - SSC
            this.sscBoard = data.academicBackground?.ssc?.board || '';
            this.sscPassingMonth = data.academicBackground?.ssc?.passingMonth || '';
            this.sscPassingYear = data.academicBackground?.ssc?.year || '';
            this.sscSeatNo = data.academicBackground?.ssc?.seatNo || '';
            this.sscTotalMarks = data.academicBackground?.ssc?.totalMarks || null;
            this.sscObtainedMarks = data.academicBackground?.ssc?.obtainedMarks || null;

            // Academic Background - HSC
            this.hscStream = data.academicBackground?.hsc?.stream || '';
            this.hscBoard = data.academicBackground?.hsc?.board || '';
            this.hscPassingMonth = data.academicBackground?.hsc?.passingMonth || '';
            this.hscPassingYear = data.academicBackground?.hsc?.year || '';
            this.hscSeatNo = data.academicBackground?.hsc?.seatNo || '';
            this.hscTotalMarks = data.academicBackground?.hsc?.totalMarks || null;
            this.hscObtainedMarks = data.academicBackground?.hsc?.obtainedMarks || null;

            // We do NOT prefill document files (File objects cannot be programmatically set for security reasons)
            // They will be optional to re-upload if they already exist, but for simplicity of this prototype, 
            // the user should probably re-upload or we assume they don't have to if they don't want to change them.
            // Let's modify validation logic to allow empty files during edit if they were previously uploaded.
            this.cdr.detectChanges();
          }
        }
      },
      error: (err) => {
        console.error('Failed to fetch application for editing', err);
        alert('Could not fetch application data. Please try again.');
        this.router.navigate(['/status']);
      }
    });
  }

  onCollegeChange(): void {
    const college = this.colleges.find(c => c.code === this.selectedCollegeCode);
    if (college) {
      this.selectedCollegeName = college.name;
      this.availablePrograms = college.programs;
      this.intendedMajor = ''; // Reset program selection
    } else {
      this.selectedCollegeName = '';
      this.availablePrograms = [];
    }
  }

  get progressWidth(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getStepClass(step: number): string {
    if (step < this.currentStep) return 'completed';
    if (step === this.currentStep) return 'active';
    return 'inactive';
  }

  isTabAccessible(step: number): boolean {
    return true; // Allow free navigation between all tabs
  }

  goToTab(step: number): void {
    if (this.isTabAccessible(step)) {
      this.warningsEnabled = true;
      this.visitedTabs[this.currentStep - 1] = true;
      this.currentStep = step;
      if (this.currentStep === 4) {
        this.submissionResult = 'none';
      }
      this.updateTabWarnings();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  nextTab(): void {
    this.warningsEnabled = true;
    this.visitedTabs[this.currentStep - 1] = true;

    // Trigger warnings but do not block navigation
    if (!this.validateStep(this.currentStep)) {
      this.updateTabWarnings();
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      if (this.currentStep === 4) {
        this.submissionResult = 'none';
        this.validationErrors = [];
      }
    }
    this.updateTabWarnings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  previousTab(): void {
    this.visitedTabs[this.currentStep - 1] = true;
    if (this.currentStep > 1) {
      this.currentStep--;
    }
    this.updateTabWarnings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  validateStep(step: number): boolean {
    switch (step) {
      case 1:
        if (!this.surname.trim() || !this.firstName.trim() || !this.fatherName.trim() ||
          !this.gender || !this.dateOfBirth || !this.aadharNumber.trim() ||
          !this.category || !this.email.trim() || !this.phone.trim() ||
          !this.address.trim() || !this.city.trim()) {
          return false;
        }
        if (this.dateOfBirth && !this.isMinimumAgeMet(this.dateOfBirth)) {
          return false;
        }
        if (this.aadharError) {
          return false;
        }
        // In edit mode, email is auto-verified, only phone needs verification
        if (this.isEditMode) {
          if (!this.phoneVerified) return false;
        } else {
          if (!this.emailVerified || !this.phoneVerified) return false;
        }
        return true;

      case 2:
        if (!this.selectedCollegeCode || !this.intendedMajor ||
          !this.sscBoard || !this.sscPassingYear || !this.sscTotalMarks || !this.sscObtainedMarks ||
          !this.hscStream || !this.hscBoard || !this.hscPassingYear || !this.hscTotalMarks || !this.hscObtainedMarks) {
          return false;
        }
        if (this.sscMarksError || this.hscMarksError || this.sscYearError || this.hscYearError) {
          return false;
        }
        return true;

      case 3:
        if (this.isEditMode) return true; // Documents are optional in edit mode
        if (!this.photoFile || !this.signatureFile || !this.marksheet10File || !this.marksheet12File) {
          return false;
        }
        return true;

      case 4:
        return true;

      default:
        return true;
    }
  }

  get aadharError(): string {
    if (!this.aadharNumber) return '';
    if (!/^\d+$/.test(this.aadharNumber)) return 'Must contain only digits';
    if (this.aadharNumber.length !== 12) return 'Must be exactly 12 digits';
    if (this.asyncAadharError) return this.asyncAadharError;
    return '';
  }

  onAadharChange(): void {
    if (this.aadharNumber && /^\d+$/.test(this.aadharNumber) && this.aadharNumber.length === 12) {
      this.applicationService.getApplicationByAadhar(this.aadharNumber.trim(), this.editAppId).subscribe({
        next: (res) => {
          if (res.success && res.application) {
            this.asyncAadharError = 'An application with this Aadhar number already exists.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          if (err.status === 404) {
            this.asyncAadharError = '';
          } else {
            console.error('Error checking Aadhar availability', err);
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      this.asyncAadharError = '';
    }
  }

  get sscMarksError(): string {
    if (this.sscTotalMarks !== null && this.sscObtainedMarks !== null && this.sscObtainedMarks > this.sscTotalMarks) {
      return 'Cannot exceed total marks';
    }
    return '';
  }

  get hscMarksError(): string {
    if (this.hscTotalMarks !== null && this.hscObtainedMarks !== null && this.hscObtainedMarks > this.hscTotalMarks) {
      return 'Cannot exceed total marks';
    }
    return '';
  }

  get sscYearError(): string {
    const currentYear = new Date().getFullYear();
    if (this.sscPassingYear && parseInt(this.sscPassingYear, 10) > currentYear) {
      return `Cannot be in the future`;
    }
    return '';
  }

  get hscYearError(): string {
    const currentYear = new Date().getFullYear();
    if (this.hscPassingYear && parseInt(this.hscPassingYear, 10) > currentYear) {
      return `Cannot be in the future`;
    }
    return '';
  }

  isMinimumAgeMet(birthDateString: string): boolean {
    if (!birthDateString) return false;
    const birthDate = new Date(birthDateString);
    const today = new Date();
    const minimumValidDate = new Date(
      birthDate.getFullYear() + this.MINIMUM_AGE,
      birthDate.getMonth(),
      birthDate.getDate()
    );
    return today >= minimumValidDate;
  }

  updateTabWarnings(): void {
    if (!this.warningsEnabled) return;
    for (let step = 1; step <= this.totalSteps; step++) {
      this.tabWarnings[step - 1] = this.visitedTabs[step - 1] && !this.validateStep(step);
    }
  }

  // --- OTP Logic ---
  setupRecaptcha() {
    const auth = getAuth();
    if (!this.recaptchaVerifier) {
      this.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-wrapper', {
        'size': 'invisible'
      });
    }
  }

  // Email OTP
  sendEmailOtp() {
    if (!this.email.trim()) {
      this.emailOtpError = 'Please enter an valid email address';
      return;
    }
    this.emailOtpLoading = true;
    this.emailOtpError = '';

    // Check for duplicate email before sending OTP
    this.applicationService.getApplicationByEmail(this.email.trim(), this.editAppId).subscribe({
      next: (res) => {
        if (res.success && res.application) {
          this.emailOtpLoading = false;
          this.emailOtpError = 'An application with this email already exists.';
          this.cdr.detectChanges();
        } else {
          this.proceedToSendEmailOtp();
        }
      },
      error: (err) => {
        // A 404 means the email is NOT in use, which is what we want!
        if (err.status === 404) {
          this.proceedToSendEmailOtp();
        } else {
          this.emailOtpLoading = false;
          this.emailOtpError = 'Error checking email availability.';
          this.cdr.detectChanges();
        }
      }
    });
  }

  private proceedToSendEmailOtp() {
    this.applicationService.sendEmailOtp(this.email.trim()).subscribe({
      next: (res) => {
        this.emailOtpLoading = false;
        if (res.success) {
          this.emailOtpSent = true;
        } else {
          this.emailOtpError = res.message || 'Failed to send OTP';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.emailOtpLoading = false;
        this.emailOtpError = err.error?.message || 'Error communicating with server';
        this.cdr.detectChanges();
      }
    });
  }

  resendEmailOtp() {
    this.sendEmailOtp();
  }

  verifyEmailOtp() {
    if (!this.emailOtp.trim() || this.emailOtp.length !== 4) return;
    this.emailOtpLoading = true;
    this.emailOtpError = '';
    this.applicationService.verifyEmailOtp(this.email.trim(), this.emailOtp.trim()).subscribe({
      next: (res) => {
        this.emailOtpLoading = false;
        if (res.success) {
          this.emailVerified = true;
          this.emailOtpError = '';
        } else {
          this.emailOtpError = res.message || 'Invalid OTP';
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.emailOtpLoading = false;
        this.emailOtpError = err.error?.message || 'Invalid OTP';
        this.cdr.detectChanges();
      }
    });
  }

  // Phone OTP
  sendPhoneOtp() {
    if (!this.phone.trim() || this.phone.trim().length !== 10) {
      this.phoneOtpError = 'Please enter a valid 10-digit mobile number';
      return;
    }

    let phoneNumber = this.phone.trim();
    if (!phoneNumber.startsWith('+')) {
      phoneNumber = '+91' + phoneNumber; // Default to India country code
    }

    this.phoneOtpLoading = true;
    this.phoneOtpError = '';

    try {
      this.setupRecaptcha();
      const auth = getAuth();
      signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier)
        .then((confirmationResult: any) => {
          this.confirmationResult = confirmationResult;
          this.phoneOtpSent = true;
          this.phoneOtpLoading = false;
          this.cdr.detectChanges();
        }).catch((error: any) => {
          this.phoneOtpError = 'Failed to send SMS. Ensure Firebase config is set. ' + error.message;
          this.phoneOtpLoading = false;
          this.cdr.detectChanges();
        });
    } catch (err: any) {
      this.phoneOtpError = 'Firebase Error: ' + err.message;
      this.phoneOtpLoading = false;
    }
  }

  resendPhoneOtp() {
    this.sendPhoneOtp();
  }

  verifyPhoneOtp() {
    if (!this.phoneOtp.trim() || !this.confirmationResult) return;
    this.phoneOtpLoading = true;
    this.phoneOtpError = '';

    this.confirmationResult.confirm(this.phoneOtp.trim()).then(() => {
      this.phoneVerified = true;
      this.phoneOtpLoading = false;
      this.phoneOtpError = '';
      this.cdr.detectChanges();
    }).catch(() => {
      this.phoneOtpError = 'Invalid Verification Code';
      this.phoneOtpLoading = false;
      this.cdr.detectChanges();
    });
  }

  onFileChange(event: Event, field: string): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    switch (field) {
      case 'photo':
        this.photoFile = input.files[0] || null;
        break;
      case 'signature':
        this.signatureFile = input.files[0] || null;
        break;
      case 'aadhar':
        this.aadharCardFile = input.files[0] || null;
        break;
      case 'ssc':
        this.marksheet10File = input.files[0] || null;
        break;
      case 'hsc':
        this.marksheet12File = input.files[0] || null;
        break;
      case 'leaving':
        this.leavingCertificateFile = input.files[0] || null;
        break;
      case 'caste':
        this.casteCertificateFile = input.files[0] || null;
        break;
    }
  }

  getFileStatus(file: File | null): string {
    return file ? 'Uploaded' : 'Missing';
  }

  async submitApplication(): Promise<void> {
    this.warningsEnabled = true;
    this.visitedTabs = [true, true, true, true];

    for (let i = 1; i < this.totalSteps; i++) {
      if (!this.validateStep(i)) {
        this.submissionResult = 'validation-error';
        this.validationErrors = ['Some required fields are missing in one or more sections.'];
        this.validationHint = 'Please review the tabs marked with ! and complete all required fields.';
        this.updateTabWarnings();
        return;
      }
    }

    const errors: string[] = [];
    let firstFailingTab = '';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.email) {
      errors.push('Email address is required.');
      if (!firstFailingTab) firstFailingTab = 'Personal Information';
    } else if (!emailRegex.test(this.email)) {
      errors.push('Please enter a valid email address.');
      if (!firstFailingTab) firstFailingTab = 'Personal Information';
    }

    const phoneRegex = /^(\+?\d{1,3}[-\s]?)?\d{10}$/;
    if (!this.phone) {
      errors.push('Phone number is required.');
      if (!firstFailingTab) firstFailingTab = 'Personal Information';
    } else if (!phoneRegex.test(this.phone)) {
      errors.push('Phone must be 10 digits.');
      if (!firstFailingTab) firstFailingTab = 'Personal Information';
    }

    if (this.aadharNumber && this.aadharNumber.length !== 12) {
      errors.push('Aadhar Number must be exactly 12 digits.');
      if (!firstFailingTab) firstFailingTab = 'Personal Information';
    }

    if (errors.length > 0) {
      this.submissionResult = 'validation-error';
      this.validationErrors = errors;
      this.validationHint = firstFailingTab ? `Hint: Check the ${firstFailingTab} section for corrections.` : '';
      this.updateTabWarnings();
      return;
    }

    this.submitting = true;
    const formData = {
      collegeSelection: {
        collegeCode: this.selectedCollegeCode,
        collegeName: this.selectedCollegeName,
      },
      personalInfo: {
        surname: this.surname.trim(),
        firstName: this.firstName.trim(),
        fatherName: this.fatherName.trim(),
        motherName: this.motherName.trim(),
        dateOfBirth: this.dateOfBirth,
        gender: this.gender,
        aadharNumber: this.aadharNumber.trim(),
        caste: this.caste.trim(),
        category: this.category
      },
      contactInfo: {
        email: this.email.trim(),
        phone: this.phone.trim(),
        address: this.address.trim(),
        city: this.city.trim(),
        stateProvince: this.stateProvince,
        zipPostalCode: this.zipPostalCode.trim(),
        country: this.country
      },
      academicBackground: {
        ssc: {
          board: this.sscBoard,
          year: this.sscPassingYear,
          seatNo: this.sscSeatNo.trim(),
          totalMarks: this.sscTotalMarks,
          obtainedMarks: this.sscObtainedMarks
        },
        hsc: {
          stream: this.hscStream,
          board: this.hscBoard,
          year: this.hscPassingYear,
          seatNo: this.hscSeatNo.trim(),
          totalMarks: this.hscTotalMarks,
          obtainedMarks: this.hscObtainedMarks
        }
      },
      programSelection: {
        intendedMajor: this.intendedMajor,
        admissionTerm: this.admissionTerm
      },
      documents: {
        isPhotoUploaded: !!this.photoFile,
        isSignatureUploaded: !!this.signatureFile,
        isAadharUploaded: !!this.aadharCardFile,
        isSscUploaded: !!this.marksheet10File,
        isHscUploaded: !!this.marksheet12File,
        isLeavingUploaded: !!this.leavingCertificateFile
      }
    };

    const submitObservable = this.isEditMode
      ? this.applicationService.updateApplication(this.editAppId, formData)
      : this.applicationService.submitApplication(formData);

    submitObservable.subscribe({
      next: (result) => {
        this.submitting = false;
        if (result.success) {
          this.submissionResult = 'success';
          this.submissionAppId = this.isEditMode ? this.editAppId : (result.applicationId || '');

          // Upload actual files to the backend
          const appId = this.submissionAppId;
          const fd = new FormData();
          let hasFiles = false;
          if (this.photoFile) { fd.append('photo', this.photoFile); hasFiles = true; }
          if (this.signatureFile) { fd.append('signature', this.signatureFile); hasFiles = true; }
          if (this.aadharCardFile) { fd.append('aadhar', this.aadharCardFile); hasFiles = true; }
          if (this.marksheet10File) { fd.append('ssc', this.marksheet10File); hasFiles = true; }
          if (this.marksheet12File) { fd.append('hsc', this.marksheet12File); hasFiles = true; }
          if (this.leavingCertificateFile) { fd.append('leaving', this.leavingCertificateFile); hasFiles = true; }
          if (this.casteCertificateFile) { fd.append('caste', this.casteCertificateFile); hasFiles = true; }

          // Fire-and-forget: upload documents in background
          if (hasFiles) {
            this.applicationService.uploadDocuments(appId, fd).subscribe({
              next: () => console.log('Documents uploaded successfully'),
              error: (e) => console.warn('Document upload failed (non-critical):', e.message)
            });
          }
        } else {
          this.submissionResult = 'error';
          this.submissionError = result.message || 'Server returned an unsuccessful response';
        }

        this.cdr.detectChanges(); // 4. Force UI update after submission response
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        this.submitting = false;
        if (err.status === 409) {
          if (err.error?.duplicateField === 'aadhar') {
            this.submissionResult = 'duplicate-aadhar';
            this.submissionEmail = ''; // Not relevant
          } else {
            this.submissionResult = 'duplicate';
            this.submissionEmail = this.email;
          }
          this.existingAppId = err.error?.applicationId || 'Not available';
        } else {
          this.submissionResult = 'error';
          this.submissionError = err.error?.message || err.message || 'Connection error. Please check your internet or try again later.';
        }

        this.cdr.detectChanges(); // 5. Force UI update after error response
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  goToEmailStep(): void {
    this.currentStep = 1;
    this.submissionResult = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm(): void {
    window.location.reload();
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToStatusChecker(): void {
    this.router.navigate(['/status']);
  }
}