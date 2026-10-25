/**
 * alertService.js
 * Creates, updates, and dispatches early-warning alerts across Socket.IO rooms.
 */

const Alert = require('../../models/Alert');
const { logAuditEvent } = require('../../middleware/audit');

let ioInstance = null;

function setSocketIO(io) {
  ioInstance = io;
}

async function createAndBroadcastAlert(alertData, req = null) {
  try {
    // Check if an identical active alert exists within the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const existing = await Alert.findOne({
      userId: alertData.userId,
      alertLevel: alertData.alertLevel,
      status: 'active',
      createdAt: { $gte: thirtyMinutesAgo },
    });

    if (existing) {
      return existing; // Avoid duplicate alert fatigue
    }

    const newAlert = await Alert.create(alertData);

    // Broadcast via Socket.IO
    if (ioInstance) {
      ioInstance.to(`user_${alertData.userId}`).emit('new_alert', newAlert);
      ioInstance.to(`caregiver_of_${alertData.userId}`).emit('caregiver_alert', {
        patientId: alertData.userId,
        alert: newAlert,
      });
    }

    if (req && req.user) {
      await logAuditEvent({
        actorId: req.user._id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'ALERT_TRIGGERED',
        resourceType: 'ALERT',
        details: { alertId: newAlert._id, level: newAlert.alertLevel },
        req,
      });
    }

    return newAlert;
  } catch (err) {
    console.error('[alertService] Error creating alert:', err);
    throw err;
  }
}

module.exports = {
  setSocketIO,
  createAndBroadcastAlert,
};
