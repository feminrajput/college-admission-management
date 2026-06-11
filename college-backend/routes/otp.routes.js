const express = require('express');
const router = express.Router();
const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');

// Set up Nodemailer transport
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Helper function to generate a 4-digit OTP
const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

// Route to send or resend Email OTP
router.post('/send-email-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Generate a 4-digit OTP
        const otpCode = generateOTP();

        // Remove any existing OTPs for this email before creating a new one (handles resend cleanly)
        await Otp.deleteMany({ email });

        // Save the new OTP payload to database
        await Otp.create({
            email,
            otp: otpCode,
        });

        // Send the email
        const mailOptions = {
            from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
            to: email,
            subject: 'Your Application OTP Code - Global University',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>You requested a verification code for your Global University application.</p>
          <p>Your 4-digit OTP is:</p>
          <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 5px; background: #f3f4f6; padding: 10px 20px; display: inline-block; border-radius: 8px;">${otpCode}</h1>
          <p>This code will expire in 5 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending Email OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again later.' });
    }
});

// Route to verify Email OTP
router.post('/verify-email-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        // Find the OTP record
        const record = await Otp.findOne({ email, otp });

        if (!record) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
        }

        // Delete the record after successful verification so it can't be reused
        await Otp.deleteOne({ _id: record._id });

        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying Email OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to verify OTP. Please try again later.' });
    }
});

module.exports = router;
