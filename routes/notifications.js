const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const authMiddleware = require('../middleware/auth');

// Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdOn', 'DESC']],
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all notifications
router.post('/clear-all', authMiddleware, async (req, res) => {
  try {
    await Notification.destroy({
      where: { userId: req.user.id },
    });

    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
