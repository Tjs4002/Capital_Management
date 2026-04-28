const express = require('express');
const router = express.Router();
const AssetRequest = require('../models/AssetRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get all asset requests
router.get('/', authMiddleware, async (req, res) => {
  try {
    let where = {};
    
    // Regular users see only their requests
    if (req.user.role === 'requester') {
      where.userId = req.user.id;
    }

    const assets = await AssetRequest.findAll({
      where,
      order: [['id', 'DESC']],
    });

    res.json({ success: true, assets, total: assets.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single asset request
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const asset = await AssetRequest.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }

    if (req.user.role === 'requester' && asset.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ success: true, asset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create asset request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assetName, assetDescription, capitalType, assetValue } = req.body;

    if (!assetName || !capitalType || !assetValue) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const asset = await AssetRequest.create({
      userId: req.user.id,
      assetName,
      assetDescription,
      capitalType,
      assetValue,
      status: 'pending',
    });

    // Notify admins
    const admins = await User.findAll({ where: { role: 'admin' } });
    for (const admin of admins) {
      await Notification.create({
        userId: admin.id,
        message: `New asset request: ${assetName}`,
        type: 'info',
        relatedTo: 'asset_request',
        relatedId: asset.id,
      });
    }

    res.json({
      success: true,
      message: 'Asset request created',
      asset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve asset request
router.post('/:id/approve', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Only capital masters can approve' });
    }

    const { allocatedFund, remarks } = req.body;
    const asset = await AssetRequest.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }

    asset.status = 'approved';
    asset.approvedOn = new Date();
    asset.approvedBy = req.user.id;
    asset.allocatedFund = allocatedFund || asset.assetValue;
    asset.capitalMasterRemarks = remarks || '';

    await asset.save();

    // Notify user
    await Notification.create({
      userId: asset.userId,
      message: `Your asset request "${asset.assetName}" has been approved`,
      type: 'approval',
      relatedTo: 'asset_request',
      relatedId: asset.id,
    });

    res.json({
      success: true,
      message: 'Asset request approved',
      asset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Deny asset request
router.post('/:id/deny', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Only capital masters can deny' });
    }

    const { reason } = req.body;
    const asset = await AssetRequest.findByPk(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Asset request not found' });
    }

    asset.status = 'denied';
    asset.denialReason = reason || 'No reason provided';

    await asset.save();

    // Notify user
    await Notification.create({
      userId: asset.userId,
      message: `Your asset request "${asset.assetName}" has been denied`,
      type: 'denial',
      relatedTo: 'asset_request',
      relatedId: asset.id,
    });

    res.json({
      success: true,
      message: 'Asset request denied',
      asset,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
