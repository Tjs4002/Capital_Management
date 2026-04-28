const fs = require('fs');
const path = require('path');
const bcryptjs = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
  console.log('✅ Created data directory');
}

// Initialize users
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
    phone: '',
    status: 'active'
  },
  {
    id: 2,
    email: 'master@capital.com',
    password: masterPassword,
    name: 'Capital Master',
    role: 'capital_master',
    department: 'Finance',
    phone: '',
    status: 'active'
  },
  {
    id: 3,
    email: 'requester@capital.com',
    password: requesterPassword,
    name: 'Asset Requester',
    role: 'requester',
    department: 'Operations',
    phone: '',
    status: 'active'
  }
];

fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
console.log('✅ Initialized users.json');

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

fs.writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allocations, null, 2));
console.log('✅ Initialized allocations.json');

// Initialize empty data files
const ASSETS_FILE = path.join(DATA_DIR, 'assets.json');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'notifications.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');

fs.writeFileSync(ASSETS_FILE, JSON.stringify([], null, 2));
fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify([], null, 2));
fs.writeFileSync(CONTACTS_FILE, JSON.stringify([], null, 2));

console.log('✅ Initialized assets.json');
console.log('✅ Initialized notifications.json');
console.log('✅ Initialized contacts.json');

console.log('\n🎉 Database initialized successfully!');
console.log('\n📊 Sample Credentials:');
console.log('  Admin: admin@capital.com / admin123');
console.log('  Capital Master: master@capital.com / master123');
console.log('  Requester: requester@capital.com / requester123');
