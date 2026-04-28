const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('approval', 'denial', 'comment', 'info'),
    defaultValue: 'info',
  },
  relatedTo: {
    type: DataTypes.STRING, // asset_request, allocation, etc.
    allowNull: false,
  },
  relatedId: DataTypes.INTEGER,
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  createdOn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: false,
});

module.exports = Notification;
