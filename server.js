const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const sequelize = require('./config/database');
const User = require('./models/User');
const { generateToken } = require('./utils/tokenStore');
const { sendVerificationEmail } = require('./utils/mailer');

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
      { id: 1, email: 'admin@capital.com', username: 'admin', password: adminPassword, name: 'Admin User', role: 'admin', department: 'Management', phone: '', status: 'active', isVerified: true },
      { id: 2, email: 'master@capital.com', username: 'master', password: masterPassword, name: 'Capital Master', role: 'capital_master', department: 'Finance', phone: '', status: 'active', isVerified: true },
      { id: 3, email: 'requester@capital.com', username: 'requester', password: requesterPassword, name: 'Asset Requester', role: 'requester', department: 'Operations', phone: '', status: 'active', isVerified: true },
      { id: 4, email: 'finance@capital.com', username: 'finance', password: adminPassword, name: 'Finance Head', role: 'finance_head', department: 'Finance', phone: '', status: 'active', isVerified: true },
      { id: 5, email: 'cfo@capital.com', username: 'cfo', password: adminPassword, name: 'Chief Finance Officer', role: 'cfo', department: 'Finance', phone: '', status: 'active', isVerified: true },
      { id: 6, email: 'md@capital.com', username: 'md', password: adminPassword, name: 'Managing Director', role: 'md', department: 'Management', phone: '', status: 'active', isVerified: true }
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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, username, department, phone, role } = req.body;
    const cleanUsername = (username || '').trim();
    if (!email || !password || !name || !cleanUsername) return res.status(400).json({ error: 'Required fields missing' });

    const users = readFile(USERS_FILE);
    if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
    if (users.find(u => String(u.username || '').toLowerCase() === cleanUsername.toLowerCase())) return res.status(400).json({ error: 'Username already exists' });

    const user = {
      id: getNextId(users),
      email,
      username: cleanUsername,
      password: bcryptjs.hashSync(password, 10),
      name,
      department: department || '',
      phone: phone || '',
      role: role || 'requester',
      status: 'active',
      isVerified: false,
      verification_email_sent_at: null
    };
    const verifyToken = generateToken(email);
    await sendVerificationEmail(email, verifyToken, getBaseUrl(req));

    user.verification_email_sent_at = new Date().toISOString();
    users.push(user);
    writeFile(USERS_FILE, users);

    res.json({ success: true, message: 'Registration successful. Please verify your email.', email: user.email, user: { id: user.id, email, username: user.username, name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email/username and password required' });

    const users = readFile(USERS_FILE);
    const user = users.find(u => u.email === email || String(u.username || '').toLowerCase() === String(email).toLowerCase());
    if (!user || !bcryptjs.compareSync(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.isVerified === false) return res.status(403).json({ error: 'Please verify your email before logging in.' });
    if (!user.username) {
      user.username = getUsernameFromEmail(user.email);
      writeFile(USERS_FILE, users);
    }

    const token = jwt.sign({ id: user.id, email: user.email, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, message: 'Login successful', token, user: { id: user.id, email: user.email, username: user.username, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// Users routes
app.get('/api/users', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    const users = readFile(USERS_FILE).map(u => ({ id: u.id, email: u.email, username: u.username || getUsernameFromEmail(u.email), name: u.name, role: u.role, department: u.department, status: u.status }));
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

// Asset ticket workflow routes
const workflowSteps = {
  pending_capital_master: 'Capital Master',
  approved_by_capital_master: 'Finance Head',
  approved_by_finance_manager: 'CFO',
  approved_by_cfo: 'MD',
  approved_by_md: 'Completed',
};

const statusLabels = {
  pending_capital_master: 'Pending Capital Master',
  approved_by_capital_master: 'Awaiting Finance Head',
  approved_by_finance_manager: 'Awaiting CFO',
  approved_by_cfo: 'Awaiting MD',
  approved_by_md: 'Approved',
  denied_by_capital_master: 'Denied by Capital Master',
  denied_by_finance_manager: 'Denied by Finance Head',
  denied_by_cfo: 'Denied by CFO',
  denied_by_md: 'Denied by MD',
};

function canAct(role, allowedRoles) {
  return allowedRoles.includes(role) || role === 'admin';
}

function findAssetIndex(assets, id) {
  return assets.findIndex(a => String(a.id) === String(id) || String(a.ticket_id) === String(id) || String(a.object_id) === String(id));
}

function normalizeAsset(asset) {
  const users = readFile(USERS_FILE);
  const requester = users.find(u => u.id == asset.user_id);
  const amount = Number(asset.amount ?? asset.asset_value ?? asset.assetValue ?? 0);
  const quantity = Number(asset.quantity ?? asset.qty ?? 1);

  return {
    ...asset,
    id: asset.id,
    objectId: asset.object_id,
    object_id: asset.object_id,
    ticketId: asset.ticket_id,
    ticket_id: asset.ticket_id,
    requestId: asset.ticket_id || asset.requestId || asset.id,
    assetName: asset.asset_name || asset.item_name || asset.assetName,
    itemName: asset.item_name || asset.asset_name || asset.assetName,
    assetValue: amount,
    amount,
    quantity,
    qty: quantity,
    department: asset.department || asset.capital_type || '',
    remarks: asset.remarks || asset.asset_description || '',
    userName: requester ? requester.name : (asset.userName || 'User'),
    requesterName: requester ? requester.name : (asset.requesterName || 'User'),
    requesterEmail: requester ? requester.email : asset.requesterEmail,
    requestedBy: requester ? requester.name : asset.requestedBy,
    requestedOn: asset.requested_on,
    requestDate: asset.request_date || (asset.requested_on ? asset.requested_on.slice(0, 10) : ''),
    requestTo: workflowSteps[asset.status] || 'Closed',
    allocatedFund: Number(asset.allocated_fund ?? asset.allocatedFund ?? amount),
    capitalMasterRemarks: asset.capital_master_remarks || '',
    financeManagerRemarks: asset.finance_manager_remarks || '',
    cfoRemarks: asset.cfo_remarks || '',
    mdRemarks: asset.md_remarks || '',
    financeManagerDenialReason: asset.finance_manager_denial_reason || '',
    cfoDenialReason: asset.cfo_denial_reason || '',
    mdDenialReason: asset.md_denial_reason || '',
    denialReason: asset.denial_reason || asset.finance_manager_denial_reason || asset.cfo_denial_reason || asset.md_denial_reason || '',
    statusLabel: statusLabels[asset.status] || asset.status,
  };
}

function getVisibleAssets(req) {
  let assets = readFile(ASSETS_FILE);
  if (req.user.role === 'requester') assets = assets.filter(a => a.user_id == req.user.id);
  return assets.map(normalizeAsset);
}

function listAssetsByStatus(req, res, statuses) {
  try {
    const assets = getVisibleAssets(req).filter(a => statuses.includes(a.status));
    res.json({ success: true, assets, total: assets.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

function createWorkflowNotification(asset, options) {
  if (!asset || !asset.user_id) return;

  const notifications = readFile(NOTIFICATIONS_FILE);
  const ticketId = asset.ticket_id || asset.requestId || asset.id;
  const reason = asset.denial_reason || asset.finance_manager_denial_reason || asset.cfo_denial_reason || asset.md_denial_reason || '';
  const messages = {
    approved_by_capital_master: {
      type: 'pending-finance',
      title: 'Request sent to Finance Head',
      message: `Your request ${ticketId} was approved by Capital Master and moved to Finance Head.`
    },
    approved_by_finance_manager: {
      type: 'pending-cfo',
      title: 'Request sent to CFO',
      message: `Your request ${ticketId} was approved by Finance Head and moved to CFO.`
    },
    approved_by_cfo: {
      type: 'pending-md',
      title: 'Request sent to MD',
      message: `Your request ${ticketId} was approved by CFO and moved to MD.`
    },
    approved_by_md: {
      type: 'md_final_approval',
      title: 'Request fully approved',
      message: `Your request ${ticketId} was approved by MD.`
    },
    denied_by_capital_master: {
      type: 'denied',
      title: 'Request declined by Capital Master',
      message: `Your request ${ticketId} was declined by Capital Master.${reason ? ` Reason: ${reason}` : ''}`
    },
    denied_by_finance_manager: {
      type: 'denied',
      title: 'Request declined by Finance Head',
      message: `Your request ${ticketId} was declined by Finance Head.${reason ? ` Reason: ${reason}` : ''}`
    },
    denied_by_cfo: {
      type: 'cfo-denial',
      title: 'Request declined by CFO',
      message: `Your request ${ticketId} was declined by CFO.${reason ? ` Reason: ${reason}` : ''}`
    },
    denied_by_md: {
      type: 'md-denial',
      title: 'Request declined by MD',
      message: `Your request ${ticketId} was declined by MD.${reason ? ` Reason: ${reason}` : ''}`
    }
  };

  const details = messages[options.to];
  if (!details) return;

  notifications.push({
    id: getNextId(notifications),
    user_id: asset.user_id,
    type: details.type,
    title: details.title,
    message: details.message,
    related_id: asset.id,
    related_ticket_id: ticketId,
    is_read: false,
    created_at: new Date().toISOString()
  });
  writeFile(NOTIFICATIONS_FILE, notifications);
}

function updateTicket(req, res, options) {
  try {
    if (!canAct(req.user.role, options.roles)) return res.status(403).json({ error: 'Unauthorized' });

    let assets = readFile(ASSETS_FILE);
    const assetIndex = findAssetIndex(assets, req.params.id);
    if (assetIndex === -1) return res.status(404).json({ error: 'Ticket not found' });

    const asset = assets[assetIndex];
    if (options.from && asset.status !== options.from) {
      return res.status(409).json({ error: `Ticket is currently ${statusLabels[asset.status] || asset.status}` });
    }

    if (options.isDenial) {
      const reason = (req.body.reason || req.body.financeManagerDenialReason || req.body.cfoDenialReason || req.body.mdDenialReason || '').trim();
      if (!reason) return res.status(400).json({ error: 'Decline reason is required' });
      asset[options.reasonField] = reason;
      asset.denial_reason = reason;
      asset.denied_on = new Date().toISOString();
    } else {
      const remarks = (req.body.remarks || '').trim();
      if (options.remarksField) asset[options.remarksField] = remarks;
      if (options.roleField) asset[options.roleField] = req.user.id;
      if (options.dateField) asset[options.dateField] = new Date().toISOString();
      if (options.allocation) {
        const allocatedFund = Number(req.body.allocatedFund || req.body.allocated_fund || 0);
        if (allocatedFund <= 0) return res.status(400).json({ error: 'Required fund is required' });
        asset.allocated_fund = allocatedFund;
        asset.amount = allocatedFund;
        asset.asset_value = allocatedFund;
      }
    }

    asset.status = options.to;
    asset.current_step = workflowSteps[options.to] || 'Closed';
    assets[assetIndex] = asset;
    writeFile(ASSETS_FILE, assets);
    createWorkflowNotification(asset, options);
    res.json({ success: true, message: options.message, asset: normalizeAsset(asset) });
  } catch (error) { res.status(500).json({ error: error.message }); }
}

app.get('/api/assets', authMiddleware, (req, res) => {
  try {
    const assets = getVisibleAssets(req).sort((a, b) => b.id - a.id);
    res.json({ success: true, assets, total: assets.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/assets/pending-capital-master', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['pending_capital_master', 'pending']));
app.get('/api/assets/pending-finance-manager', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_capital_master']));
app.get('/api/assets/pending-cfo', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_finance_manager']));
app.get('/api/assets/pending-md', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_cfo']));
app.get('/api/assets/approved-by-finance', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_finance_manager', 'approved_by_cfo', 'approved_by_md']));
app.get('/api/assets/approved-by-cfo', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_cfo', 'approved_by_md']));
app.get('/api/assets/approved-by-md', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['approved_by_md']));
app.get('/api/assets/denied-by-finance', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['denied_by_finance_manager']));
app.get('/api/assets/denied-by-cfo', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['denied_by_cfo']));
app.get('/api/assets/denied-by-md', authMiddleware, (req, res) => listAssetsByStatus(req, res, ['denied_by_md']));

app.get('/api/assets/status-counts', authMiddleware, (req, res) => {
  try {
    const assets = getVisibleAssets(req);
    res.json({
      success: true,
      pendingReview: assets.filter(a => ['pending_capital_master', 'approved_by_capital_master', 'approved_by_finance_manager', 'approved_by_cfo'].includes(a.status)).length,
      finallyApproved: assets.filter(a => a.status === 'approved_by_md').length,
      finallyDenied: assets.filter(a => String(a.status).startsWith('denied_by_')).length,
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/assets/:id', authMiddleware, (req, res) => {
  try {
    const asset = readFile(ASSETS_FILE).find(a => findAssetIndex([a], req.params.id) !== -1);
    if (!asset) return res.status(404).json({ error: 'Ticket not found' });
    if (req.user.role === 'requester' && asset.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    res.json({ success: true, asset: normalizeAsset(asset) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets', authMiddleware, (req, res) => {
  try {
    const itemName = (req.body.itemName || req.body.assetName || '').trim();
    const quantity = Number(req.body.quantity || req.body.qty || 0);
    const amount = Number(req.body.amount || req.body.assetValue || 0);
    const department = (req.body.department || req.body.capitalType || '').trim();
    const remarks = (req.body.remarks || req.body.assetDescription || '').trim();

    if (!itemName || quantity <= 0) {
      return res.status(400).json({ error: 'Item name and quantity are required' });
    }

    let assets = readFile(ASSETS_FILE);
    const id = getNextId(assets);
    const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const asset = {
      id,
      object_id: `OBJ-${todayKey}-${String(id).padStart(4, '0')}`,
      ticket_id: `TKT-${todayKey}-${String(id).padStart(4, '0')}`,
      user_id: req.user.id,
      item_name: itemName,
      asset_name: itemName,
      quantity,
      amount,
      asset_value: amount,
      department,
      capital_type: department || 'General',
      remarks,
      asset_description: remarks,
      status: 'pending_capital_master',
      current_step: 'Capital Master',
      requested_on: new Date().toISOString(),
      request_date: req.body.requestDate || new Date().toISOString().slice(0, 10),
    };
    assets.push(asset);
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Ticket created and sent to Capital Master', assetId: asset.id, ticketId: asset.ticket_id, objectId: asset.object_id, asset: normalizeAsset(asset) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/assets/:id', authMiddleware, (req, res) => {
  try {
    let assets = readFile(ASSETS_FILE);
    const assetIndex = findAssetIndex(assets, req.params.id);
    if (assetIndex === -1) return res.status(404).json({ error: 'Ticket not found' });

    const asset = assets[assetIndex];
    if (req.user.role !== 'admin' && asset.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (!['pending_capital_master', 'pending'].includes(asset.status)) {
      return res.status(409).json({ error: 'Only tickets waiting for Capital Master can be edited' });
    }

    const itemName = (req.body.itemName || req.body.assetName || '').trim();
    const quantity = Number(req.body.quantity || req.body.qty || 0);
    const department = (req.body.department || req.body.capitalType || '').trim();
    const remarks = (req.body.remarks || req.body.assetDescription || '').trim();

    if (!itemName || quantity <= 0) return res.status(400).json({ error: 'Item name and quantity are required' });

    asset.item_name = itemName;
    asset.asset_name = itemName;
    asset.quantity = quantity;
    asset.department = department;
    asset.capital_type = department || 'General';
    asset.remarks = remarks;
    asset.asset_description = remarks;
    asset.request_date = req.body.requestDate || asset.request_date;
    asset.updated_on = new Date().toISOString();

    assets[assetIndex] = asset;
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Ticket updated', asset: normalizeAsset(asset) });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/assets/bulk', authMiddleware, (req, res) => {
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
    const statuses = Array.isArray(req.body.statuses) ? req.body.statuses.map(String) : [];
    const canClearAll = ['admin', 'capital_master', 'finance_head', 'finance_manager', 'cfo', 'md'].includes(req.user.role);

    let assets = readFile(ASSETS_FILE);
    const beforeCount = assets.length;
    assets = assets.filter(asset => {
      const matchesId = ids.length ? ids.some(id => findAssetIndex([asset], id) !== -1) : true;
      const matchesStatus = statuses.length ? statuses.includes(asset.status) : true;
      const visibleToUser = canClearAll || asset.user_id == req.user.id;
      return !(matchesId && matchesStatus && visibleToUser);
    });

    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, deleted: beforeCount - assets.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/assets/:id', authMiddleware, (req, res) => {
  try {
    let assets = readFile(ASSETS_FILE);
    const assetIndex = findAssetIndex(assets, req.params.id);
    if (assetIndex === -1) return res.status(404).json({ error: 'Ticket not found' });

    const asset = assets[assetIndex];
    if (req.user.role !== 'admin' && asset.user_id !== req.user.id) return res.status(403).json({ error: 'Unauthorized' });
    if (!['pending_capital_master', 'pending'].includes(asset.status)) {
      return res.status(409).json({ error: 'Only tickets waiting for Capital Master can be deleted' });
    }

    assets.splice(assetIndex, 1);
    writeFile(ASSETS_FILE, assets);
    res.json({ success: true, message: 'Ticket deleted' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets/:id/approve', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['capital_master'],
  from: 'pending_capital_master',
  to: 'approved_by_capital_master',
  allocation: true,
  remarksField: 'capital_master_remarks',
  roleField: 'capital_master_approved_by',
  dateField: 'capital_master_approved_on',
  message: 'Ticket approved by Capital Master and sent to Finance Head',
}));

app.post('/api/assets/:id/deny', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['capital_master'],
  from: 'pending_capital_master',
  to: 'denied_by_capital_master',
  isDenial: true,
  reasonField: 'denial_reason',
  message: 'Ticket declined by Capital Master',
}));

app.post('/api/assets/:id/approve-finance-manager', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['finance_manager', 'finance_head'],
  from: 'approved_by_capital_master',
  to: 'approved_by_finance_manager',
  remarksField: 'finance_manager_remarks',
  roleField: 'finance_manager_approved_by',
  dateField: 'finance_manager_approved_on',
  message: 'Ticket approved by Finance Head and sent to CFO',
}));

app.post('/api/assets/:id/deny-finance-manager', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['finance_manager', 'finance_head'],
  from: 'approved_by_capital_master',
  to: 'denied_by_finance_manager',
  isDenial: true,
  reasonField: 'finance_manager_denial_reason',
  message: 'Ticket declined by Finance Head',
}));

app.post('/api/assets/:id/approve-cfo', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['cfo'],
  from: 'approved_by_finance_manager',
  to: 'approved_by_cfo',
  remarksField: 'cfo_remarks',
  roleField: 'cfo_approved_by',
  dateField: 'cfo_approved_on',
  message: 'Ticket approved by CFO and sent to MD',
}));

app.post('/api/assets/:id/deny-cfo', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['cfo'],
  from: 'approved_by_finance_manager',
  to: 'denied_by_cfo',
  isDenial: true,
  reasonField: 'cfo_denial_reason',
  message: 'Ticket declined by CFO',
}));

app.post('/api/assets/:id/approve-md', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['md'],
  from: 'approved_by_cfo',
  to: 'approved_by_md',
  remarksField: 'md_remarks',
  roleField: 'md_approved_by',
  dateField: 'md_approved_on',
  message: 'Ticket approved by MD',
}));

app.post('/api/assets/:id/deny-md', authMiddleware, (req, res) => updateTicket(req, res, {
  roles: ['md'],
  from: 'approved_by_cfo',
  to: 'denied_by_md',
  isDenial: true,
  reasonField: 'md_denial_reason',
  message: 'Ticket declined by MD',
}));

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

app.delete('/api/notifications/:id', authMiddleware, (req, res) => {
  try {
    let notifications = readFile(NOTIFICATIONS_FILE);
    const beforeCount = notifications.length;
    notifications = notifications.filter(n => !(n.id == req.params.id && n.user_id == req.user.id));
    writeFile(NOTIFICATIONS_FILE, notifications);
    res.json({ success: true, deleted: beforeCount - notifications.length });
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
      console.log(`  Finance Head: finance@capital.com / admin123`);
      console.log(`  CFO: cfo@capital.com / admin123`);
      console.log(`  MD: md@capital.com / admin123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
