const CaregiverRelationship = require('../models/CaregiverRelationship');
const Consent = require('../models/Consent');
const User = require('../models/User');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const Alert = require('../models/Alert');
const HealthBaseline = require('../models/HealthBaseline');
const { logAuditEvent } = require('../middleware/audit');

// List patients monitored by caregiver
const getMonitoredPatients = async (req, res) => {
  try {
    const relationships = await CaregiverRelationship.find({
      caregiverId: req.user._id,
      status: 'active',
    }).populate('patientId', 'name email');

    const patientSummaries = [];

    for (const rel of relationships) {
      if (!rel.patientId) continue;
      const patient = rel.patientId;

      // Verify active consent
      const consent = await Consent.findOne({
        patientId: patient._id,
        authorizedPartyId: req.user._id,
        status: 'active',
      });

      if (!consent || !consent.scopes.viewPhysiologicalData) {
        continue; // Respect patient consent
      }

      const [latestReading, activeAlerts, baseline] = await Promise.all([
        PhysiologicalReading.findOne({ userId: patient._id }).sort({ timestamp: -1 }),
        Alert.find({ userId: patient._id, status: 'active' }).sort({ createdAt: -1 }),
        HealthBaseline.findOne({ userId: patient._id }),
      ]);

      let status = 'Stable';
      let alertLevel = 'GREEN';
      if (activeAlerts.some((a) => a.alertLevel === 'RED')) {
        status = 'Attention';
        alertLevel = 'RED';
      } else if (activeAlerts.some((a) => a.alertLevel === 'YELLOW')) {
        status = 'Monitor';
        alertLevel = 'YELLOW';
      }

      patientSummaries.push({
        patientId: patient._id,
        name: patient.name,
        email: patient.email,
        relationshipType: rel.relationshipType,
        status,
        alertLevel,
        latestReading,
        baseline,
        activeAlertsCount: activeAlerts.length,
        lastSync: latestReading ? latestReading.timestamp : null,
        consentGrantedAt: consent.grantedAt,
      });
    }

    res.json({
      success: true,
      count: patientSummaries.length,
      data: patientSummaries,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Check consent and return detailed patient info
const verifyCaregiverAccess = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    // Check relationship
    const relationship = await CaregiverRelationship.findOne({
      caregiverId: req.user._id,
      patientId,
      status: 'active',
    });

    if (!relationship) {
      return res.status(403).json({
        success: false,
        message: 'No active caregiver relationship found for this patient.',
      });
    }

    // Check consent
    const consent = await Consent.findOne({
      patientId,
      authorizedPartyId: req.user._id,
      status: 'active',
    });

    if (!consent || !consent.scopes.viewPhysiologicalData) {
      return res.status(403).json({
        success: false,
        message: 'Patient has not granted or has revoked authorization to view health records.',
      });
    }

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'VIEW_HEALTH_DATA',
      targetUserId: patientId,
      resourceType: 'READING',
      req,
    });

    next();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getMonitoredPatients,
  verifyCaregiverAccess,
};
