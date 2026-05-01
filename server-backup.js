const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypts = require('bcryptjs');
const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const app = express();
const db = new Database(path.join(__dirname, 'capital_management.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '.')));

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header missing' });
    }
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Auth Routes
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, department, phone, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = bcrypts.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, department, phone, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(email, hashedPassword, name, department || '', phone || '', role || 'requester', 'active');

    const token = jwt.sign(
      { id: result.lastInsertRowid, email, role: role || 'requester' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'User registered successfully',
      userId: result.lastInsertRowid,
      token,
      user: { id: result.lastInsertRowid, email, name, role: role || 'requester' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordValid = bcrypts.compareSync(password, user.password);
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

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Users Routes
app.get('/api/users', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const users = db.prepare('SELECT id, email, name, role, department, status FROM users ORDER BY id DESC').all();
    res.json({ success: true, users, total: users.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, name, role, department, phone, status FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.id !== parseInt(req.params.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { name, department, phone, status } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare(`
      UPDATE users SET name = ?, department = ?, phone = ?, status = ? WHERE id = ?
    `).run(name || user.name, department || user.department, phone || user.phone, status || user.status, req.params.id);

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: name || user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Asset Requests Routes
app.get('/api/assets', authMiddleware, (req, res) => {
  try {
    let query = 'SELECT * FROM asset_requests';
    let params = [];

    if (req.user.role === 'requester') {
      query += ' WHERE user_id = ?';
      params = [req.user.id];
    }

    query += ' ORDER BY id DESC';
    const assets = db.prepare(query).all(...params);
    res.json({ success: true, assets, total: assets.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/assets/:id', authMiddleware, (req, res) => {
  try {
    const asset = db.prepare('SELECT * FROM asset_requests WHERE id = ?').get(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }
    if (req.user.role === 'requester' && asset.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets', authMiddleware, (req, res) => {
  try {
    const { assetName, assetDescription, capitalType, assetValue } = req.body;

    if (!assetName || !capitalType || !assetValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare(`
      INSERT INTO asset_requests (user_id, asset_name, asset_description, capital_type, asset_value, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, assetName, assetDescription, capitalType, assetValue, 'pending');

    // Notify admins
    const admins = db.prepare('SELECT id FROM users WHERE role = ?').all('admin');
    admins.forEach(admin => {
      db.prepare(`
        INSERT INTO notifications (user_id, message, type, related_to, related_id)
        VALUES (?, ?, ?, ?, ?)
      `).run(admin.id, `New asset request: ${assetName}`, 'info', 'asset_request', result.lastInsertRowid);
    });

    res.json({
      success: true,
      message: 'Asset request created',
      assetId: result.lastInsertRowid,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets/:id/approve', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Only capital masters can approve' });
    }

    const { allocatedFund, remarks } = req.body;
    const asset = db.prepare('SELECT * FROM asset_requests WHERE id = ?').get(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }

    db.prepare(`
      UPDATE asset_requests SET status = ?, approved_on = ?, approved_by = ?, allocated_fund = ?, capital_master_remarks = ? WHERE id = ?
    `).run('approved', new Date().toISOString(), req.user.id, allocatedFund || asset.asset_value, remarks || '', req.params.id);

    // Notify user
    db.prepare(`
      INSERT INTO notifications (user_id, message, type, related_to, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(asset.user_id, `Your asset request "${asset.asset_name}" has been approved`, 'approval', 'asset_request', asset.id);

    res.json({
      success: true,
      message: 'Asset request approved',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/assets/:id/deny', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Only capital masters can deny' });
    }

    const { reason } = req.body;
    const asset = db.prepare('SELECT * FROM asset_requests WHERE id = ?').get(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }

    db.prepare(`
      UPDATE asset_requests SET status = ?, denial_reason = ? WHERE id = ?
    `).run('denied', reason || 'No reason provided', req.params.id);

    // Notify user
    db.prepare(`
      INSERT INTO notifications (user_id, message, type, related_to, related_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(asset.user_id, `Your asset request "${asset.asset_name}" has been denied`, 'denial', 'asset_request', asset.id);

    res.json({
      success: true,
      message: 'Asset request denied',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fund Allocations Routes
app.get('/api/allocations', authMiddleware, (req, res) => {
  try {
    const allocations = db.prepare('SELECT * FROM fund_allocations ORDER BY capital_type ASC').all();
    const summary = {
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocated_amount, 0),
      totalUsed: allocations.reduce((sum, a) => sum + a.used_amount, 0),
      totalAvailable: allocations.reduce((sum, a) => sum + a.available_amount, 0),
    };
    res.json({ success: true, allocations, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/allocations', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { capitalType, allocatedAmount, remarks } = req.body;

    if (!capitalType || allocatedAmount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existing = db.prepare('SELECT * FROM fund_allocations WHERE capital_type = ?').get(capitalType);

    if (existing) {
      db.prepare(`
        UPDATE fund_allocations SET allocated_amount = ?, available_amount = ?, allocated_by = ?, allocated_on = ?, remarks = ? WHERE capital_type = ?
      `).run(allocatedAmount, allocatedAmount - existing.used_amount, req.user.id, new Date().toISOString(), remarks || existing.remarks, capitalType);
    } else {
      db.prepare(`
        INSERT INTO fund_allocations (capital_type, allocated_amount, used_amount, available_amount, allocated_by, remarks)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(capitalType, allocatedAmount, 0, allocatedAmount, req.user.id, remarks || '');
    }

    res.json({
      success: true,
      message: existing ? 'Allocation updated' : 'Allocation created',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications Routes
app.get('/api/notifications', authMiddleware, (req, res) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_on DESC').all(req.user.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notifications/clear-all', authMiddleware, (req, res) => {
  try {
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(req.user.id);
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Contact Routes
app.post('/api/contact', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    db.prepare(`
      INSERT INTO contact_replies (name, email, subject, message, message_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, email, subject, message, new Date().toISOString(), 'pending');

    res.json({ success: true, message: 'Your message has been received' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/contact', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const contacts = db.prepare('SELECT * FROM contact_replies ORDER BY message_date DESC').all();
    res.json({ success: true, contacts, total: contacts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/contact/:id/reply', authMiddleware, (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { replyMessage } = req.body;
    const contact = db.prepare('SELECT * FROM contact_replies WHERE id = ?').get(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    db.prepare(`
      UPDATE contact_replies SET reply_message = ?, reply_date = ?, replied_by = ?, status = ? WHERE id = ?
    `).run(replyMessage, new Date().toISOString(), req.user.id, 'replied', req.params.id);

    res.json({ success: true, message: 'Reply sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Database: SQLite at ./capital_management.db`);
});
