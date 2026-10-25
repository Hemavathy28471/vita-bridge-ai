const { processUserQuery } = require('../services/chatService');

// Send message to VitaGuide
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a message string.' });
    }

    const targetUserId = req.query.patientId || req.user._id;
    const response = await processUserQuery(targetUserId, message);

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  sendMessage,
};
