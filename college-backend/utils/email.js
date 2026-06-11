const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const MAIL_FROM = `${process.env.MAIL_FROM_NAME || "Admissions Office"} <${process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USER}>`;

// Send application confirmation email
async function sendApplicationEmail({ toEmail, appId, name, program, date, firstName, lastName }) {
  if (!toEmail) return;
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("MAIL credentials not set, skipping email.");
    return;
  }

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: toEmail,
      subject: `Your Application has been submitted - ID ${appId}`,
      html: `
        <p>Dear ${firstName} ${lastName},</p>
        <p>Thank you for applying to <strong>Global University</strong>.</p>
        <p>Your application has been received successfully. Your details are:</p>
        <ul>
          <li><strong>Application ID:</strong> ${appId}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Program:</strong> ${program}</li>
          <li><strong>Submitted On:</strong> ${date}</li>
          <li><strong>Status:</strong> Under Review</li>
        </ul>
        <p>You can check your application status anytime using the Application ID or your email on the status page.</p>
        <p>Best regards,<br/>Global University Admissions Team</p>
      `,
      text: `Dear ${firstName} ${lastName},\n\nThank you for applying to Global University.\n\nYour application has been received successfully. Details:\n- Application ID: ${appId}\n- Name: ${name}\n- Program: ${program}\n- Submitted On: ${date}\n- Status: Under Review\n\nBest regards,\nGlobal University Admissions Team`,
    });
    console.log("Email sent to:", toEmail);
  } catch (err) {
    console.error("Error sending email:", err.message);
  }
}

// Send status update email
async function sendStatusUpdateEmail({ toEmail, appId, name, program, status, queryMessage, date, actionTakenBy }) {
  if (!toEmail) return;
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log("MAIL credentials not set, skipping status email.");
    return;
  }

  let subjectStatusPart = status;
  if (status === "Approved") subjectStatusPart = "Approved";
  else if (status === "Rejected") subjectStatusPart = "Rejected";
  else if (status === "Query Raised") subjectStatusPart = "Query / Clarification Required";
  else subjectStatusPart = status || "Updated";

  let statusLine = `Your application status is now: ${status}.`;
  if (status === "Approved") statusLine = "Your application has been APPROVED.";
  else if (status === "Rejected") statusLine = "Your application has been REJECTED.";
  else if (status === "Query Raised") statusLine = "A QUERY has been raised on your application. Please review the note below.";

  const queryBlockHtml = queryMessage ? `<p><strong>Note from Admissions:</strong><br>${queryMessage}</p>` : "";
  const queryBlockText = queryMessage ? `\nNote from Admissions:\n${queryMessage}\n` : "";

  let adminBlockHtml = "";
  let adminBlockText = "";
  if (actionTakenBy && actionTakenBy.name) {
    let roleLabel = "Administrator";
    if (actionTakenBy.role === "super_admin") roleLabel = "University Superadmin";
    else if (actionTakenBy.role === "college_admin") roleLabel = "College Admissions Board";
    
    adminBlockHtml = `<p><strong>Action Authorized By:</strong> ${actionTakenBy.name} (${roleLabel})</p>`;
    adminBlockText = `\nAction Authorized By: ${actionTakenBy.name} (${roleLabel})\n`;
  }

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to: toEmail,
      subject: `Application ${subjectStatusPart} - ID ${appId}`,
      html: `
        <p>Dear ${name},</p>
        <p>${statusLine}</p>
        <p>Your application details:</p>
        <ul>
          <li><strong>Application ID:</strong> ${appId}</li>
          <li><strong>Program:</strong> ${program}</li>
          <li><strong>Last Updated:</strong> ${date}</li>
          <li><strong>Current Status:</strong> ${status}</li>
        </ul>
        ${queryBlockHtml}
        ${adminBlockHtml}
        <p>You can check your application status anytime using your Application ID or email on the status page.</p>
        <p>Best regards,<br/>Global University Admissions Team</p>
      `,
      text: `Dear ${name},\n\n${statusLine}\n\nApplication details:\n- Application ID: ${appId}\n- Program: ${program}\n- Last Updated: ${date}\n- Current Status: ${status}\n${queryBlockText}${adminBlockText}\nBest regards,\nGlobal University Admissions Team`,
    });
    console.log("Status update email sent to:", toEmail, "Status:", status);
  } catch (err) {
    console.error("Error sending status update email:", err.message);
  }
}

module.exports = {
  sendApplicationEmail,
  sendStatusUpdateEmail,
  transporter,
};
