const express = require('express');
const router = express.Router();
const { generateToken, verifyToken } = require('../utils/tokenStore');
const { sendVerificationEmail } = require('../utils/mailer');

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
    return res.redirect('/verify-email.html?status=invalid');
  }

  try {
    const User = require('../models/User');
    await User.update({ isVerified: true }, { where: { email } });
    console.log(`✅ Email verified: ${email}`);
    res.redirect('/verify-email.html?status=success');
  } catch (err) {
    console.error('Error updating user verification:', err);
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