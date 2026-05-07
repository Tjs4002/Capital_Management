const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use TLS (not SSL)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  socketTimeout: 10000,
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error);
  } else {
    console.log('✅ Email service ready');
  }
});

/**
 * Send a verification email to the user
 * @param {string} toEmail
 * @param {string} token
 * @param {string} [baseUrl]
 */
async function sendVerificationEmail(toEmail, token, baseUrl) {
  const rootUrl = (baseUrl || process.env.PUBLIC_BASE_URL || process.env.BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
  const verifyUrl = `${rootUrl}/verify-email?token=${token}`;

  try {
    const info = await transporter.sendMail({
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
    console.log(`✅ Verification email sent to ${toEmail}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${toEmail}:`, error.message);
    throw error;
  }
}

module.exports = { sendVerificationEmail };
