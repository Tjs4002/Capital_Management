const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send a verification email to the user
 * @param {string} toEmail
 * @param {string} token
 */
async function sendVerificationEmail(toEmail, token) {
  const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Verify your Budget Management account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto;">
        <h2>Email Verification</h2>
        <p>Thanks for registering! Click the button below to verify your email address.</p>
        <a href="${verifyUrl}" 
           style="display:inline-block; padding:12px 24px; background:#4f46e5;
                  color:#fff; border-radius:6px; text-decoration:none; font-weight:bold;">
          Verify Email
        </a>
        <p style="margin-top:16px; color:#888; font-size:13px;">
          This link expires in 24 hours. If you didn't register, ignore this email.
        </p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };