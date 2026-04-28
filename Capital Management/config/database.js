const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'capital_management.db'),
  logging: false, // Set to console.log for debugging
});

module.exports = sequelize;
