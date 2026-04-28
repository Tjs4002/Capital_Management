const sequelize = require('./config/database');
const User = require('./models/User');
const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log('✅ Created data directory');
}

// Sync database
async function initDatabase() {
  try {
    // Sync models
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    // Create default users if they don't exist
    const adminExists = await User.findOne({ where: { email: 'admin@capital.com' } });
    if (!adminExists) {
      await User.create({
        email: 'admin@capital.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        department: 'Management',
        phone: '1234567890',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Created admin user');
    }

    const masterExists = await User.findOne({ where: { email: 'master@capital.com' } });
    if (!masterExists) {
      await User.create({
        email: 'master@capital.com',
        password: 'master123',
        name: 'Capital Master',
        role: 'capital_master',
        department: 'Finance',
        phone: '1234567891',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Created master user');
    }

    const requesterExists = await User.findOne({ where: { email: 'requester@capital.com' } });
    if (!requesterExists) {
      await User.create({
        email: 'requester@capital.com',
        password: 'requester123',
        name: 'Asset Requester',
        role: 'requester',
        department: 'Operations',
        phone: '1234567892',
        status: 'active',
        isVerified: true
      });
      console.log('✅ Created requester user');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  }
}

// Initialize JSON data files
function initJSONDataFiles() {
  // Initialize users JSON file
  const USERS_FILE = path.join(DATA_DIR, 'users.json');
  const adminPassword = bcryptjs.hashSync('admin123', 10);
  const masterPassword = bcryptjs.hashSync('master123', 10);
  const requesterPassword = bcryptjs.hashSync('requester123', 10);

  const users = [
    {
      id: 1,
      email: 'admin@capital.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      department: 'Management',
      phone: '1234567890',
      status: 'active'
    },
    {
      id: 2,
      email: 'master@capital.com',
      password: masterPassword,
      name: 'Capital Master',
      role: 'capital_master',
      department: 'Finance',
      phone: '1234567891',
      status: 'active'
    },
    {
      id: 3,
      email: 'requester@capital.com',
      password: requesterPassword,
      name: 'Asset Requester',
      role: 'requester',
      department: 'Operations',
      phone: '1234567892',
      status: 'active'
    }
  ];

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    console.log('✅ Initialized users.json');
  } else {
    console.log('✅ Users file already exists');
  }

  // Initialize allocations
  const ALLOCATIONS_FILE = path.join(DATA_DIR, 'allocations.json');
  const capitalTypes = [
    'Plant and Machinery',
    'Building',
    'Vehicles',
    'Computer and Electronics',
    'Furniture and Fixtures',
    'Equipment'
  ];

  const allocations = capitalTypes.map((type, i) => ({
    id: i + 1,
    capital_type: type,
    allocated_amount: 500000,
    used_amount: 0,
    available_amount: 500000,
    remarks: 'Initial allocation'
  }));

  if (!fs.existsSync(ALLOCATIONS_FILE)) {
    fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allocations, null, 2));
    console.log('✅ Initialized allocations.json');
  } else {
    console.log('✅ Allocations file already exists');
  }

  // Initialize empty data files
  const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
  const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
  const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

  if (!fs.existsSync(ASSETS_FILE)) {
    fs.writeFileSync(ASSETS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Initialized assets.json');
  }

  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Initialized notifications.json');
  }

  if (!fs.existsSync(CONTACTS_FILE)) {
    fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));
    console.log('✅ Initialized contacts.json');
  }
}

// Initialize both database and JSON files
(async () => {
  try {
    await initDatabase();
    initJSONDataFiles();
    
    console.log('\n🎉 Database initialized successfully!');
    console.log('\n📊 Sample Credentials:');
    console.log('  Admin: admin@capital.com / admin123');
    console.log('  Capital Master: master@capital.com / master123');
    console.log('  Requester: requester@capital.com / requester123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  }
})();
