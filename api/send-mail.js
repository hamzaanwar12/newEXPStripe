// File: /api/send-mail.js (Express.js implementation)
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { body, validationResult } = require("express-validator");

require("dotenv").config();


// Load environment variables from .env file
console.log("MAIL_USER:", process.env.MAIL_USER);
console.log("MAIL_PASSWORD exists:", !!process.env.MAIL_PASSWORD);
// Configure email transporter for Gmail
const transporter = nodemailer.createTransport({
  service: "gmail", // Using Gmail service
  auth: {
    user: process.env.MAIL_USER, // hahamzanwar12@gmail.com
    pass: process.env.MAIL_PASSWORD, // Your app password: kxgh xgxa sqkl xiid
  },
});

// Validation middleware
const validateContactForm = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("message")
    .trim()
    .isLength({ min: 10 })
    .withMessage("Message must be at least 10 characters"),
];

// This route will be accessible at /api/mail/check
router.get("/check", (req, res) => {
  res.send("Welcome to the email sending API!");
});

// This route will be accessible at /api/mail/send-mail
router.post("/send-mail", validateContactForm, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, message } = req.body;

    // Construct email content
    const mailOptions = {
      from: `"Portfolio Contact" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_TO, // hamzaanwar2003@gmail.com
      replyTo: email, // Visitor's email from form
      subject: `New message from ${name} (Portfolio Contact)`,
      text: `Contact Form Submission:
      
Name: ${name}
Email: ${email}

Message:
${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">New Portfolio Message</h2>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px;">
            <p><strong style="color: #2c3e50;">From:</strong> ${name} (${email})</p>
            <p><strong style="color: #2c3e50;">Message:</strong></p>
            <div style="padding: 10px; background: white; border-left: 3px solid #3498db; margin-top: 5px;">
              ${message.replace(/\n/g, "<br>")}
            </div>
          </div>
          <p style="margin-top: 20px; color: #7f8c8d; font-size: 0.9em;">
            You can reply directly to this email to contact ${name}.
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      success: false,
      message:
        "Failed to send message. Please try again later or contact me directly at hamzaanwar2003@gmail.com",
        // error: error,
    });
  }
});

module.exports = router;