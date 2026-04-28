const express = require('express');
const router = express.Router();
const FundAllocation = require('../models/FundAllocation');
const authMiddleware = require('../middleware/auth');

// Get all fund allocations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const allocations = await FundAllocation.findAll({
      order: [['capitalType', 'ASC']],
    });

    const summary = {
      totalAllocated: allocations.reduce((sum, a) => sum + a.allocatedAmount, 0),
      totalUsed: allocations.reduce((sum, a) => sum + a.usedAmount, 0),
      totalAvailable: allocations.reduce((sum, a) => sum + a.availableAmount, 0),
    };

    res.json({
      success: true,
      allocations,
      summary,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create or update fund allocation
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { capitalType, allocatedAmount, remarks } = req.body;

    if (!capitalType || allocatedAmount === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let allocation = await FundAllocation.findOne({ where: { capitalType } });

    if (allocation) {
      allocation.allocatedAmount = allocatedAmount;
      allocation.availableAmount = allocatedAmount - allocation.usedAmount;
      allocation.remarks = remarks || allocation.remarks;
      allocation.allocatedBy = req.user.id;
      allocation.allocatedOn = new Date();
    } else {
      allocation = await FundAllocation.create({
        capitalType,
        allocatedAmount,
        usedAmount: 0,
        availableAmount: allocatedAmount,
        allocatedBy: req.user.id,
        remarks: remarks || '',
      });
    }

    await allocation.save();

    res.json({
      success: true,
      message: allocation._changed ? 'Allocation updated' : 'Allocation created',
      allocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update allocation by capital type (for approving requests)
router.put('/:capitalType', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'capital_master') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { usedAmount } = req.body;
    const allocation = await FundAllocation.findOne({
      where: { capitalType: req.params.capitalType },
    });

    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }

    allocation.usedAmount = usedAmount;
    allocation.availableAmount = allocation.allocatedAmount - usedAmount;

    await allocation.save();

    res.json({
      success: true,
      message: 'Funds deducted successfully',
      allocation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
