const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const FundAllocation = sequelize.define('FundAllocation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  capitalType: {
    type: DataTypes.ENUM(
      'Plant and Machinery',
      'Building',
      'Vehicles',
      'Computer and Electronics',
      'Furniture and Fixtures',
      'Equipment'
    ),
    allowNull: false,
  },
  allocatedAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  usedAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  availableAmount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0,
  },
  allocatedBy: DataTypes.INTEGER,
  allocatedOn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  remarks: DataTypes.TEXT,
}, {
  timestamps: true,
});

module.exports = FundAllocation;
