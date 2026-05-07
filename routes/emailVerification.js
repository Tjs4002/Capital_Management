const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../utils/tokenStore');
const { sendVerificationEmail } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');
const os = require('os');

const usersJsonPath = path.join(__dirname, '../data/users.json');
function getBaseUrl(req) {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, '');
  const host = req.get('host') || '';
  const isLocalHost = /^localhost(?::\d+)?$/i.test(host) || /^127\.0\.0\.1(?::\d+)?$/i.test(host);
  if (isLocalHost) {
    const port = host.split(':')[1] || process.env.PORT || '5000';
    const networks = os.networkInterfaces();
    for (const addresses of Object.values(networks)) {
      const address = (addresses || []).find(item => item.family === 'IPv4' && !item.internal);
      if (address) return `${req.protocol}://${address.address}:${port}`;
    }
  }
  return (host ? `${req.protocol}://${host}` : (process.env.BASE_URL || 'http://localhost:5000')).replace(/\/$/, '');
}

// Call this from your existing registration route AFTER saving the user
// OR use the /send-verification endpoint directly
router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please provide a valid email address' });
  }

  try {
    const token = generateToken(email);
    await sendVerificationEmail(email, token, getBaseUrl(req));
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: err.message || 'Failed to send verification email.' });
  }
});

// The link in the email hits this route
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const email = verifyToken(token);

  if (!email) {
    console.log('❌ Invalid or expired token');
    return res.redirect('/verify-email.html?status=invalid');
  }

  try {
    const User = require('../models/User');
    await User.update({ isVerified: true }, { where: { email } });
    console.log(`✅ Database updated for email: ${email}`);
    
    // Update users.json
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    const userIndex = usersData.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (userIndex !== -1) {
      console.log(`✅ Found user in users.json at index ${userIndex}`);
      usersData[userIndex].isVerified = true;
      usersData[userIndex].verified_at = new Date().toISOString();
      fs.writeFileSync(usersJsonPath, JSON.stringify(usersData, null, 2));
      console.log(`✅ Email verified and saved to users.json: ${email}`);
    } else {
      console.log(`⚠️ User not found in users.json: ${email}`);
    }
    
    res.redirect('/verify-email.html?status=success');
  } catch (err) {
    console.error('❌ Error updating user verification:', err);
    res.redirect('/verify-email.html?status=error');
  }
});

// Resend link - accepts email OR username
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email or username is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let actualEmail = email;

  try {
    // If it looks like a username (not an email), look it up in users.json
    if (!emailRegex.test(email)) {
      const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
      const user = usersData.find(u => (u.username || '').toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return res.status(400).json({ message: 'User not found. Please check your email or username.' });
      }
      actualEmail = user.email;
    }

    const token = generateToken(actualEmail);
    await sendVerificationEmail(actualEmail, token, getBaseUrl(req));
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    const userIndex = usersData.findIndex(u => u.email.toLowerCase() === actualEmail.toLowerCase());
    if (userIndex !== -1) {
      usersData[userIndex].verification_email_sent_at = new Date().toISOString();
      fs.writeFileSync(usersJsonPath, JSON.stringify(usersData, null, 2));
    }
    res.json({ message: 'A new verification email has been sent. Please check your inbox.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: err.message || 'Failed to resend email.' });
  }
});

module.exports = router;
