const mongoose = require('mongoose');

const consentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorizedPartyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    authorizedPartyRole: {
      type: String,
      enum: ['caregiver', 'doctor', 'clinic', 'researcher'],
      default: 'caregiver',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'revoked', 'expired'],
      default: 'active',
    },
    scopes: {
      viewPhysiologicalData: { type: Boolean, default: true },
      viewAlerts: { type: Boolean, default: true },
      viewTrends: { type: Boolean, default: true },
      receiveEmergencyNotifications: { type: Boolean, default: true },
      exportHealthReports: { type: Boolean, default: false },
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: Date,
    revokedAt: Date,
    revocationReason: String,
    signedIp: String,
  },
  {
    timestamps: true,
  }
);

consentSchema.index({ patientId: 1, authorizedPartyId: 1, status: 1 });

module.exports = mongoose.model('Consent', consentSchema);
