const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  dialectModule: require('better-sqlite3'),
  storage: path.join(__dirname, 'capital_management.db'),
  logging: false,
});

module.exports = sequelize;