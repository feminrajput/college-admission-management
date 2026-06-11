# PROJECT REPORT
**603-01 - Fundamentals of Full stack Web Development**

**“College Admission Management System”**

At
“SMT. Z. S. Patel College of Computer Application (BCA)”,
Surat

As a partial fulfillment
For the degree of
Bachelor of Computer Application (B.C.A) during 6th Semester
2025-2026

**Guided By:**
DHVANI KANOJE

**Submitted By:**
RAJPUT FEMIN ASHISHBHAI
SAINDANE JIGNESH TUKARAM

VIDHYADHAN CHARITABLE TRUST
Smt. Z.S. PATEL COLLEGE OF COMPUTER APPLICATION
PALANPUR JAKATNAKA, ADAJAN SURAT. Ph.: 0261-2760963
Affiliated To
Veer Narmad South Gujarat University, Surat, Gujarat, India.

---

## INDEX

[TOC]

---

## Acknowledgment
We would like to express our sincere gratitude to Smt. Z.S. Patel College of Computer Application for providing us with the valuable opportunity to undertake this project. This project has greatly enhanced our knowledge, skills, and understanding of the subject matter.

We would also like to extend our sincere appreciation to our faculty guide, DHVANI KANOJE, BCA Department, Smt. Z.S. Patel College of Computer Application, for their academic guidance, insightful inputs, and encouragement during the preparation of this project report.

**Signatures of Students:** 
________________________ (RAJPUT FEMIN ASHISHBHAI)
________________________ (SAINDANE JIGNESH TUKARAM)
**Date:** ________________________

---

## Declaration
We, RAJPUT FEMIN ASHISHBHAI and SAINDANE JIGNESH TUKARAM, students of BCA, 6th Semester, at Smt. Z.S. Patel College of Computer Application, hereby declare that the project report titled "College Admission Management System", submitted in partial fulfillment of the requirements for the award of the Bachelor of Computer Application degree, is a genuine and original work carried out by us.

This project has been completed under the supervision and guidance of DHVANI KANOJE, at Smt. Z.S. Patel College of Computer Application. We further declare that this project report has not been submitted previously to any other university or institution for the award of any degree, diploma, or certificate.

**Place:** Surat
**Date:** ___________________
**Signatures:** 
___________________ (RAJPUT FEMIN ASHISHBHAI)
___________________ (SAINDANE JIGNESH TUKARAM)

---

## Chapter 1: Introduction

### 1.1 Project Overview
The "College Admission Management System" is a robust, full-stack web application designed to digitize and manage the entire lifecycle of student admissions. The system provides multiple dedicated portals for different users: Students (for applications and status tracking), Teachers (for managing college-specific assignments and grading), Admins, and Superadmins. It features a secure multi-step application form supported by robust authentication mechanisms like email and mobile OTP verifications.

### 1.2 Objectives
* To digitize and streamline the traditionally paper-heavy admission process.
* To provide applicants with a transparent, real-time mechanism to track their application status.
* To implement a secure verification process using Dual OTP authentication (Email via Nodemailer and Mobile via Firebase).
* To establish a strict role-based access control (RBAC) system for Superadmins, Admins, and Teachers.

### 1.3 Scope
This project focuses on the core admission workflow. The scope includes:
* Student registration, email/phone verification, and submission of academic & personal details including document uploads.
* Teacher dashboard for viewing student applications from their respective colleges and grading assignments.
* Admin panel to review applications, approve/reject students, or raise specific queries via automated emails.
* Superadmin dashboard to manage all colleges, admins, and oversee the entire system metrics.

### 1.4 Problem Statement
Traditional admission processes involve significant manual labor, redundant paperwork, and lack a streamlined communication channel between the college and the applicants. Without a centralized system, verifying student identities (like phone numbers and emails) is difficult, and tracking application statuses internally is prone to human error. There is an urgent need for an automated, full-stack digital solution to simplify this workflow.

---

## Chapter 2: System Analysis

### 2.1 Existing System
The existing approach typically uses distributed systems such as physical forms or basic Google Forms. Identity verification happens manually, and updates on an application's status are often communicated through disconnected, manual phone calls or sporadic emails. 

### 2.2 Limitations
* **Data Inaccuracy:** High chances of fake or spam applications due to the lack of strict OTP verification.
* **Lack of Transparency:** Students cannot seamlessly track where their application is in the queue.
* **Inefficient Management:** Administrators find it difficult to assign context-specific permissions (e.g., ensuring teachers only access data for their assigned colleges).

### 2.3 Proposed System
The proposed "College Admission Management System" uses modern full-stack web technologies to overcome these limitations. It introduces automated dual-channel verification (Email & SMS), automated email notifications upon status changes, and scoped access controls. A teacher will only see the assignments and students for their specific college, and superadmins manage high-level statistics without interfering with granular grading.

### 2.4 Feasibility Study
* **Technical Feasibility:** The system uses the MEAN/MERN-like stack (Angular, NodeJS, MongoDB). These open-source technologies provide massive community support and are highly scalable.
* **Operational Feasibility:** The user-friendly Angular frontend ensures a smooth learning curve for admins and applicants.
* **Economic Feasibility:** The digital architecture requires minimal hardware, leveraging cloud-based solutions which vastly reduces the administrative overhead and paperwork cost.

---

## Chapter 3: System Design

### 3.1 System Architecture
The application follows a modern 3-Tier Client-Server Architecture:
1. **Presentation Layer (Frontend):** Developed in Angular using TypeScript and standard web technologies (HTML/CSS).
2. **Business/Application Layer (Backend):** A Node.js and Express.js REST API that handles logic, verifications, file uploads, and routing.
3. **Data Layer (Database):** A NoSQL MongoDB database connected via Mongoose for flexible and scalable document storage.

### 3.2 Data Flow Diagram (DFD)
* **Level 0 (Context Diagram):** Shows the high-level interaction where Students submit data to the System, and the System sends OTPs and Status Updates. Admins request applicant data from the System and push status updates.
* **Level 1 (Detailed DFD):** Breaks down the system into core processes: User Registration/OTP Generation -> Application Form Submission -> Admin Triage/Review -> Generation of Confirmation Emails.

### 3.3 Use Case Diagram
* **Actors:** Student, Teacher, Admin, Superadmin.
* **Use Cases:** 
  * *Student:* Login, Verify OTP, Submit Application, Upload Documents, View Status.
  * *Teacher:* Login, View College Students, Grade Assignments.
  * *Admin:* View Applications, Filter by Course/Status, Update Status, Raise Query.
  * *Superadmin:* Add/Manage Colleges, Manage Roles, View System Statistics.

### 3.4 Database Design (ER Diagram)
* **Users Collection:** Stores standard users (applicants) with fields for Email, Phone, Password Hash, and standard demographic details.
* **Applications Collection:** Links to User ID, contains embedded documents for Personal Info, Academic Info, Upload Paths, and Status enum.
* **Admins Collection:** Stores Admin/Teacher profiles with fields specifying their assigned `college_id` and Role (Admin, Teacher, Superadmin).
* **OTPs Collection:** Stores transient generated OTP sequences and expiration timestamps mapped to Email/Phone for validation.

### 3.5 UI Design
The system utilizes a responsive design methodology.
* The frontend features a sleek multi-step wizard for students to navigate the application form easily.
* Administrative panels feature responsive data tables, comprehensive dashboard cards with statistical overviews, and modal pop-ups for updating application statuses without full page reloads.

---

## Chapter 4: Technology Used

* **Frontend:** Angular (TypeScript, HTML5, Vanilla/Custom CSS)
* **Backend:** Node.js, Express.js framework
* **Database:** MongoDB (using Mongoose ODM)
* **Authentication:** JSON Web Tokens (JWT) for session management, bcrypt for secure password hashing.
* **Third-Party Services:** Firebase Authentication (for mobile Phone OTP & Recaptcha verification), Nodemailer (for SMTP Email OTP and status update notifications).
* **File Management:** Multer middleware for handling multipart/form-data for document uploads.

---

## Chapter 5: Implementation

The implementation was divided into modular components:
1. **Backend API Initialization:** Setup of the Express server, Mongoose connections, and environment variables configurations (stored securely in `.env`).
2. **Authentication Flow:** Implemented OTP routes (`/api/otp/send-email`, `/api/otp/verify-email`) and integrated Firebase for frontend phone verification.
3. **Application Manager:** Constructed the multi-part data submission endpoints, ensuring documents were securely saved through Multer middleware into local storage uploads directory.
4. **Role Routing:** Developed robust authorization middlewares that intercept requests and ensure `Teacher` or `Superadmin` credentials match the resources they attempt to access.
5. **Frontend Integration:** Linked the Angular HTTP services to the backend endpoints, managing UI states and displaying real-time feedback and validation errors.

---

## Chapter 6: Testing

The system underwent rigorous testing phases:
* **Unit Testing:** Individual testing of backend functions, notably testing the Nodemailer transporter readiness, OTP logic validation, and correct password hashing processes.
* **Integration Testing:** Ensuring the Angular frontend could successfully transmit complex `FormData` objects (containing images/documents) to the Express backend and handle HTTP responses correctly.
* **Functional/Manual Testing:** 
  * Creating sample student data and evaluating the step-by-step form execution.
  * Verifying role restrictions (e.g., verifying that a Superadmin cannot execute Teacher grading POST requests based on previously fixed constraints).
  * Checking CSS and UI consistency across the Teacher and Superadmin panels.

---

## Chapter 7: Results

The finalized College Admission Management System successfully meets the defined objectives.
* Students can register and verify their accounts seamlessly using both their mobile device and email address within minutes.
* The file upload capabilities efficiently capture academic proofs without performance bottlenecks.
* Admins are equipped with a powerful dashboard allowing them to review, approve, or raise queries on applications immediately, automatically triggering customized notification emails to the applicant.
* Data scoping issues were resolved, ensuring teachers only evaluate relevant students.

---

## Chapter 8: Conclusion & Future Scope

### Conclusion
The project successfully encapsulates the requirements of modern admissions into a single, cohesive full-stack web application. By leveraging modern frameworks like Angular and Node.js, the resulting platform is highly responsive, secure, and user-friendly. It significantly reduces administrative overhead and standardizes communication between the institution and prospective students.

### Future Scope
* **Payment Gateway Integration:** The system can be expanded to allow students to pay admission or application processing fees directly on the portal via services like Stripe or Razorpay.
* **Advanced Analytics:** Incorporating Machine Learning techniques to forecast admission bottlenecks or predict application success rates based on historical data points.
* **Mobile Application:** While the web application is responsive, developing a dedicated native or cross-platform mobile application (using Flutter or React Native) would increase accessibility for student users.

---

## References

1. Node.js Documentation [https://nodejs.org/docs]
2. Express.js API Reference [https://expressjs.com/]
3. Angular Framework Documentation [https://angular.io/docs]
4. MongoDB & Mongoose Guides [https://mongoosejs.com/]
5. Firebase Authentication Docs [https://firebase.google.com/docs/auth]
6. Nodemailer Application documentation [https://nodemailer.com/]
