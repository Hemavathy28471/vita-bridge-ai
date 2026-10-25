const { generateInsightsForUser } = require('../services/insightService');

// Get health insights
const getInsights = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user._id;
    const insights = await generateInsightsForUser(targetUserId);

    res.json({
      success: true,
      data: insights,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getInsights,
};
