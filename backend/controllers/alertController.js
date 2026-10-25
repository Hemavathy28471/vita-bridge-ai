const Alert = require('../models/Alert');
const { logAuditEvent } = require('../middleware/audit');

// List alerts
const getAlerts = async (req, res) => {
  try {
    const { level, status, patientId } = req.query;
    const targetUserId = patientId || req.user._id;

    const filter = { userId: targetUserId };
    if (level) filter.alertLevel = level.toUpperCase();
    if (status) filter.status = status;

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single alert with Explainable AI
const getAlertById = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Acknowledge alert
const acknowledgeAlert = async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.status = 'acknowledged';
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = req.user._id;
    await alert.save();

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'ALERT_ACKNOWLEDGED',
      resourceType: 'ALERT',
      details: { alertId: alert._id, alertLevel: alert.alertLevel },
      req,
    });

    res.json({
      success: true,
      message: 'Alert marked as acknowledged.',
      data: alert,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAlerts,
  getAlertById,
  acknowledgeAlert,
};
