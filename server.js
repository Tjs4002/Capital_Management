const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const sequelize = require('./config/database');
const User = require('./models/User');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Data storage paths
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const ALLOCATIONS_FILE = path.join(DATA_DIR, 'allocations.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

// Initialize data files
function initDataFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    const adminPassword = bcryptjs.hashSync('admin123', 10);
    const masterPassword = bcryptjs.hashSync('master123', 10);
    const requesterPassword = bcryptjs.hashSync('requester123', 10);

    fs.writeFileSync(USERS_FILE, JSON.stringify([
      { id: 1, email: 'admin@capital.com', password: adminPassword, name: 'Admin User', role: 'admin', department: 'Management', phone: '', status: 'active', isVerified: true },
      { id: 2, email: 'master@capital.com', password: masterPassword, name: 'Capital Master', role: 'capital_master', department: 'Finance', phone: '', status: 'active', isVerified: true },
      { id: 3, email: 'requester@capital.com', password: requesterPassword, name: 'Asset Requester', role: 'requester', department: 'Operations', phone: '', status: 'active', isVerified: true }
    ], null, 2));
  }

  if (!fs.existsSync(ALLOCATIONS_FILE)) {
    const types = ['Plant and Machinery', 'Building', 'Vehicles', 'Computer and Electronics', 'Furniture and Fixtures', 'Equipment'];
    const allocations = types.map((type, i) => ({
      id: i + 1, capital_type: type, allocated_amount: 500000, used_amount: 0, available_amount: 500000, remarks: 'Initial allocation'
    }));
    fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allocations, null, 2));
  }

  if (!fs.existsSync(ASSETS_FILE)) fs.writeFileSync(ASSETS_FILE, JSON.stringify([], null, 2));
  if (!fs.existsSync(NOTIFICATIONS_FILE)) fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
  if (!fs.existsSync(CONTACTS_FILE)) fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
}

// Helper functions
const readFile = (filePath) => { try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); } catch { return []; } };
const writeFile = (filePath, data) => { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); };
const getNextId = (data) => Math.max(0, ...data.map(d => d.id || 0)) + 1;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Authorization header missing' });
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
};

// Auth routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, department, phone, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Required fields missing' });

    const users = readFile(USERS_FILE);
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });

    const user = { id: getNextId(users), email, password: bcryptjs.hashSync(password, 10), name, department: department || '', phone: phone || '', role: role || 'requester', status: 'active' };
    users.push(user);
    writeFile(USERS_FILE, users);

    const token = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'User registered', token, user: { id: user.id, email, name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const users = readFile(USERS_FILE);
    const user = users.find(u => u.email === email);
    if (!user || !bcryptjs.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Login successful', token, user: { id: user.id, email, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Users routes
app.get('/api/users', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const users = readFile(USERS_FILE).map(u => ({ id: u.id, email: u.email, name: u.name, role: u.role, department: u.department, status: u.status }));
    res.json({ success: true, users, total: users.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
  try {
    const user = readFile(USERS_FILE).find(u => u.id == req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.id != req.params.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    let users = readFile(USERS_FILE);
    const userIndex = users.findIndex(u => u.id == req.params.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });
    Object.assign(users[userIndex], req.body);
    writeFile(USERS_FILE, users);
    res.json({ success: true, message: 'User updated' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    let users = readFile(USERS_FILE);
    users = users.filter(u => u.id != req.params.id);
    writeFile(USERS_FILE, users);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Asset routes
app.get('/api/assets', authMiddleware, (req, res) => {
  try {
    let assets = readFile(ASSETS_FILE);
    if (req.user.role === 'requester') assets = assets.filter(a => a.user_id == req.user.id);
    res.json({ success: true, assets, total: assets.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/assets/:id', authMiddleware, (req, res) => {
  try {
    const asset = readFile(ASSETS_FILE).find(a => a.id == req.params.id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    if (req.user.role === 'requester' && asset.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    res.json({ success: true, asset });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets', authMiddleware, (req, res) => {
  try {
    const { assetName, assetDescription, capitalType, assetValue } = req.body;
    if (!assetName || !capitalType || !assetValue) return res.status(400).json({ error: 'Missing fields' });
    let assets = readFile(ASSETS_FILE);
    const asset = { id: getNextId(assets), user_id: req.user.id, asset_name: assetName, asset_description: assetDescription, capital_type: capitalType, asset_value: assetValue, status: 'pending', requested_on: new Date().toISOString() };
    assets.push(asset);
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Asset request created', assetId: asset.id });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets/:id/approve', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'capital_master') return res.status(403).json({ error: 'Unauthorized' });
    let assets = readFile(ASSETS_FILE);
    const assetIndex = assets.findIndex(a => a.id == req.params.id);
    if (assetIndex === -1) return res.status(404).json({ error: 'Asset not found' });
    assets[assetIndex].status = 'approved';
    assets[assetIndex].approved_on = new Date().toISOString();
    assets[assetIndex].approved_by = req.user.id;
    assets[assetIndex].allocated_fund = req.body.allocatedFund || assets[assetIndex].asset_value;
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Asset approved' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets/:id/deny', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'capital_master') return res.status(403).json({ error: 'Unauthorized' });
    let assets = readFile(ASSETS_FILE);
    const assetIndex = assets.findIndex(a => a.id == req.params.id);
    if (assetIndex === -1) return res.status(404).json({ error: 'Asset not found' });
    assets[assetIndex].status = 'denied';
    assets[assetIndex].denial_reason = req.body.reason || '';
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Asset denied' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Allocations routes
app.get('/api/allocations', authMiddleware, (req, res) => {
  try {
    const allocations = readFile(ALLOCATIONS_FILE);
    const summary = {
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocated_amount, 0),
      totalUsed: allocations.reduce((sum, a) => sum + a.used_amount, 0),
      totalAvailable: allocations.reduce((sum, a) => sum + a.available_amount, 0)
    };
    res.json({ success: true, allocations, summary });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/allocations', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'capital_master') return res.status(403).json({ error: 'Unauthorized' });
    const { capitalType, allocatedAmount, remarks } = req.body;
    let allocations = readFile(ALLOCATIONS_FILE);
    let allocation = allocations.find(a => a.capital_type === capitalType);
    if (allocation) {
      allocation.allocated_amount = allocatedAmount;
      allocation.available_amount = allocatedAmount - (allocation.used_amount || 0);
    } else {
      allocation = { id: getNextId(allocations), capital_type: capitalType, allocated_amount: allocatedAmount, used_amount: 0, available_amount: allocatedAmount, remarks };
      allocations.push(allocation);
    }
    writeFile(ALLOCATIONS_FILE, allocations);
    res.json({ success: true, message: 'Allocation saved' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Notifications routes
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = readFile(NOTIFICATIONS_FILE).filter(n => n.user_id == req.user.id);
    res.json({ success: true, notifications, unreadCount: notifications.filter(n => !n.is_read).length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    let notifications = readFile(NOTIFICATIONS_FILE);
    const notif = notifications.find(n => n.id == req.params.id);
    if (!notif || notif.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    notif.is_read = 1;
    writeFile(NOTIFICATIONS_FILE, notifications);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/notifications/clear-all', authMiddleware, (req, res) => {
  try {
    let notifications = readFile(NOTIFICATIONS_FILE);
    notifications = notifications.filter(n => n.user_id !== req.user.id);
    writeFile(NOTIFICATIONS_FILE, notifications);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Contact routes
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields required' });
    let contacts = readFile(CONTACTS_FILE);
    contacts.push({ id: getNextId(contacts), name, email, subject, message, message_date: new Date().toISOString(), status: 'pending' });
    writeFile(CONTACTS_FILE, contacts);
    res.json({ success: true, message: 'Message received' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/contact', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const contacts = readFile(CONTACTS_FILE);
    res.json({ success: true, contacts, total: contacts.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Mount Sequelize-based auth routes (with email verification)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// API endpoint to check user verification status
app.get('/api/auth/verify-status/:email', async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.params.email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ isVerified: user.isVerified, email: user.email });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mount email verification routes
const emailVerificationRoutes = require('./routes/emailVerification');
app.use('/', emailVerificationRoutes);

// Static files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));

// Init and start
async function startServer() {
  try {
    // Sync database with models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    initDataFiles();
    
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📁 Data stored at: ${DATA_DIR}`);
      console.log(`\n📊 Sample Credentials:`);
      console.log(`  Admin: admin@capital.com / admin123`);
      console.log(`  Capital Master: master@capital.com / master123`);
      console.log(`  Requester: requester@capital.com / requester123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
