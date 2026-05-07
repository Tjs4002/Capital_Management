const nodemailer = require('nodemailer');

// Validate required environment variables
const requiredEnvVars = ['EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
const missingEnvVars = requiredEnvVars.filter(env => !process.env[env]);

if (missingEnvVars.length > 0) {
  console.warn(`⚠️  Missing email configuration: ${missingEnvVars.join(', ')}`);
}

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
  greetingTimeout: 10000,
  family: 4, // Force IPv4 only
});

// Test email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email service error:', error.message);
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
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!toEmail || !emailRegex.test(toEmail)) {
    throw new Error(`Invalid email address: ${toEmail}`);
  }

  // Validate EMAIL_FROM is configured
  if (!process.env.EMAIL_FROM) {
    throw new Error('Email service not configured. Please set EMAIL_FROM environment variable.');
  }

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
