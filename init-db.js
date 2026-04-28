const path = require('path');
const sequelize = require('./config/database');
const User = require('./models/User');

(async () => {
  try {
    console.log('📝 Syncing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synchronized');

    console.log('📝 Creating default users...');
    
    // Check if users already exist
    const adminExists = await User.findOne({ where: { email: 'admin@capital.com' } });
    
    if (!adminExists) {
      const users = [
        {
          email: 'admin@capital.com',
          password: 'admin123',
          name: 'Admin User',
          role: 'admin',
          department: 'Management',
          phone: '1234567890',
          status: 'active'
        },
        {
          email: 'master@capital.com',
          password: 'master123',
          name: 'Capital Master',
          role: 'capital_master',
          department: 'Finance',
          phone: '1234567891',
          status: 'active'
        },
        {
          email: 'requester@capital.com',
          password: 'requester123',
          name: 'Asset Requester',
          role: 'requester',
          department: 'Operations',
          phone: '1234567892',
          status: 'active'
        }
      ];

      await User.bulkCreate(users);
      console.log('✅ Default users created');
    } else {
      console.log('✅ Users already exist');
    }

    console.log('✅ Database initialization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
})();
