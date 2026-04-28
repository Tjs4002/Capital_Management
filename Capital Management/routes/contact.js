const express = require('express');
const router = express.Router();
const ContactReply = require('../models/ContactReply');
const authMiddleware = require('../middleware/auth');

// Submit contact message
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const contact = await ContactReply.create({
      name,
      email,
      subject,
      message,
      messageDate: new Date(),
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Your message has been received',
      contactId: contact.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all contact messages (admin only)
router.get('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const contacts = await ContactReply.findAll({
      order: [['messageDate', 'DESC']],
    });

    res.json({
      success: true,
      contacts,
      total: contacts.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reply to contact message (admin only)
router.post('/:id/reply', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { replyMessage } = req.body;
    const contact = await ContactReply.findByPk(req.params.id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact message not found' });
    }

    contact.replyMessage = replyMessage;
    contact.replyDate = new Date();
    contact.repliedBy = req.user.id;
    contact.status = 'replied';

    await contact.save();

    res.json({
      success: true,
      message: 'Reply sent successfully',
      contact,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
