const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AssetRequest = sequelize.define('AssetRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  assetName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  assetDescription: DataTypes.TEXT,
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
  assetValue: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'denied'),
    defaultValue: 'pending',
  },
  requestedOn: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  approvedOn: DataTypes.DATE,
  approvedBy: DataTypes.INTEGER,
  allocatedFund: DataTypes.FLOAT,
  capitalMasterRemarks: DataTypes.TEXT,
  denialReason: DataTypes.TEXT,
}, {
  timestamps: true,
});

module.exports = AssetRequest;
