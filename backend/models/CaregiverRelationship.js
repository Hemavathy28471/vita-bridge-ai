const mongoose = require('mongoose');

const caregiverRelationshipSchema = new mongoose.Schema(
  {
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: ['spouse', 'adult_child', 'parent', 'professional_nurse', 'guardian', 'friend'],
      default: 'spouse',
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['pending_invitation', 'active', 'suspended', 'terminated'],
      default: 'active',
    },
    notificationRules: {
      notifyOnYellowAlerts: { type: Boolean, default: true },
      notifyOnRedAlerts: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

caregiverRelationshipSchema.index({ caregiverId: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('CaregiverRelationship', caregiverRelationshipSchema);
