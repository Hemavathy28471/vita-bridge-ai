const Consent = require('../models/Consent');
const CaregiverRelationship = require('../models/CaregiverRelationship');
const User = require('../models/User');
const { logAuditEvent } = require('../middleware/audit');

// List consents for current user (as patient)
const getConsents = async (req, res) => {
  try {
    const consents = await Consent.find({ patientId: req.user._id })
      .populate('authorizedPartyId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: consents,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Grant new consent
const grantConsent = async (req, res) => {
  try {
    const { authorizedPartyEmail, scopes, relationshipType = 'spouse' } = req.body;

    const authorizedUser = await User.findOne({ email: authorizedPartyEmail.toLowerCase() });
    if (!authorizedUser) {
      return res.status(404).json({ success: false, message: 'Caregiver account with this email not found.' });
    }

    if (authorizedUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot grant consent to yourself.' });
    }

    // Upsert consent
    let consent = await Consent.findOne({
      patientId: req.user._id,
      authorizedPartyId: authorizedUser._id,
    });

    if (consent) {
      consent.status = 'active';
      if (scopes) consent.scopes = { ...consent.scopes, ...scopes };
      consent.grantedAt = new Date();
      consent.revokedAt = null;
      await consent.save();
    } else {
      consent = await Consent.create({
        patientId: req.user._id,
        authorizedPartyId: authorizedUser._id,
        authorizedPartyRole: authorizedUser.role,
        scopes: scopes || {
          viewPhysiologicalData: true,
          viewAlerts: true,
          viewTrends: true,
          receiveEmergencyNotifications: true,
        },
      });
    }

    // Ensure caregiver relationship exists
    await CaregiverRelationship.findOneAndUpdate(
      { caregiverId: authorizedUser._id, patientId: req.user._id },
      { relationshipType, status: 'active' },
      { upsert: true, new: true }
    );

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'CONSENT_GRANTED',
      targetUserId: authorizedUser._id,
      resourceType: 'CONSENT',
      details: { scopes: consent.scopes },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Consent granted to ${authorizedUser.name}.`,
      data: consent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Revoke consent
const revokeConsent = async (req, res) => {
  try {
    const consent = await Consent.findOne({
      _id: req.params.id,
      patientId: req.user._id,
    });

    if (!consent) {
      return res.status(404).json({ success: false, message: 'Consent record not found.' });
    }

    consent.status = 'revoked';
    consent.revokedAt = new Date();
    await consent.save();

    // Suspend caregiver relationship
    await CaregiverRelationship.findOneAndUpdate(
      { caregiverId: consent.authorizedPartyId, patientId: req.user._id },
      { status: 'suspended' }
    );

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'CONSENT_REVOKED',
      targetUserId: consent.authorizedPartyId,
      resourceType: 'CONSENT',
      req,
    });

    res.json({
      success: true,
      message: 'Access consent revoked immediately.',
      data: consent,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getConsents,
  grantConsent,
  revokeConsent,
};
