const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorEmail: String,
    actorRole: String,
    action: {
      type: String,
      required: true,
      enum: [
        'AUTH_LOGIN',
        'AUTH_LOGOUT',
        'AUTH_REGISTER',
        'VIEW_HEALTH_DATA',
        'EXPORT_HEALTH_DATA',
        'CONSENT_GRANTED',
        'CONSENT_REVOKED',
        'DEVICE_CONNECTED',
        'DEVICE_DISCONNECTED',
        'SIMULATION_TRIGGERED',
        'ALERT_ACKNOWLEDGED',
        'ALERT_TRIGGERED',
        'PROFILE_UPDATED',
        'DATA_INGESTION',
        'RECHECK_STARTED',
        'RECHECK_COMPLETED',
        'ACTIVITY_CONTEXT_SUBMITTED',
        'BIOMETRIC_PURGED',
      ],
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['USER', 'READING', 'BASELINE', 'ALERT', 'CONSENT', 'DEVICE', 'SYSTEM', 'OBSERVATION', 'RECHECK'],
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'DENIED', 'ERROR'],
      default: 'SUCCESS',
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: String,
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ targetUserId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
