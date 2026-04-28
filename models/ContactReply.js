const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactReply = sequelize.define('ContactReply', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  messageDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  replyMessage: DataTypes.TEXT,
  replyDate: DataTypes.DATE,
  repliedBy: DataTypes.INTEGER,
  status: {
    type: DataTypes.ENUM('pending', 'replied'),
    defaultValue: 'pending',
  },
});

module.exports = ContactReply;
