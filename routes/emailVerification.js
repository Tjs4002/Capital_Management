const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../utils/tokenStore');
const { sendVerificationEmail } = require('../utils/mailer');
const fs = require('fs');
const path = require('path');

const usersJsonPath = path.join(__dirname, '../data/users.json');

// Call this from your existing registration route AFTER saving the user
// OR use the /send-verification endpoint directly
router.post('/send-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const token = generateToken(email);
    await sendVerificationEmail(email, token);
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: 'Failed to send verification email.' });
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

// Resend link
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const token = generateToken(email);
    await sendVerificationEmail(email, token);
    res.json({ message: 'A new verification email has been sent.' });
  } catch (err) {
    console.error('Mail error:', err);
    res.status(500).json({ message: 'Failed to resend email.' });
  }
});

module.exports = router;