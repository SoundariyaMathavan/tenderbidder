// test-email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "soundariyamathavan0@gmail.com",
    pass: "ievdnpogtaptbbub",
  },
});

transporter.sendMail({
  from: "soundariyamathavan0@gmail.com",
  to: "soundariyamathavan0@gmail.com",
  subject: "Test Email",
  text: "This is a test email.",
}, (err, info) => {
  if (err) {
    console.error("Error:", err);
  } else {
    console.log("Email sent:", info.response);
  }
});