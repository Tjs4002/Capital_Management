const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sequelize = require('../config/database');
const { generateToken } = require('../utils/tokenStore');         // ADD
const { sendVerificationEmail } = require('../utils/mailer');     // ADD
const fs = require('fs');
const path = require('path');
const os = require('os');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const usersJsonPath = path.join(__dirname, '../data/users.json');
const getUsernameFromEmail = (email) => String(email || 'user').split('@')[0];
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

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, username, department, phone, role } = req.body;
    const cleanUsername = String(username || getUsernameFromEmail(email)).trim();

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const user = await User.create({
      email,
      password,
      name,
      department: department || '',
      phone: phone || '',
      role: role || 'requester',
      status: 'active',
    });

    // Save to users.json
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    const newUserData = {
      id: user.id,
      email: user.email,
      username: cleanUsername,
      password: user.password,
      name: user.name,
      role: user.role,
      department: user.department,
      phone: user.phone,
      status: user.status,
      isVerified: false,
      verification_email_sent_at: null
    };
    usersData.push(newUserData);

    // Send verification email                                     // ADD
    const verifyToken = generateToken(email);                      // ADD
    await sendVerificationEmail(email, verifyToken, getBaseUrl(req));               // ADD
    newUserData.verification_email_sent_at = new Date().toISOString();
    fs.writeFileSync(usersJsonPath, JSON.stringify(usersData, null, 2));

    res.json({
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check users.json for verification status
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    const userInJson = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Block unverified users - check from users.json
    if (!userInJson || !userInJson.isVerified) {                  
      return res.status(403).json({                               
        error: 'Please verify your email before logging in.'      
      });                                                          
    }                                                              

    const passwordValid = await user.validatePassword(password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check verification status by email
router.get('/verify-status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const usersData = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
    const user = usersData.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ 
      isVerified: user.isVerified || false,
      email: user.email
    });
  } catch (error) {
    console.error('Error checking verification status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
