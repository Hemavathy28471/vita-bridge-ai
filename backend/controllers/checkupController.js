const MultimodalCheckup = require('../models/MultimodalCheckup');
const HealthBaseline = require('../models/HealthBaseline');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { evaluateMultimodalCheckup } = require('../ai/multimodalSensingEngine');
const { logAuditEvent } = require('../middleware/audit');

// Submit multimodal bio-sensing checkup (Camera + Mic + Questionnaire)
const submitCheckup = async (req, res) => {
  try {
    const { visualBiomarkers, vocalBiomarkers, questionnaire } = req.body;
    const userId = req.user._id;

    // Fetch baseline & latest readings for context
    const [baseline, latestReading] = await Promise.all([
      HealthBaseline.findOne({ userId }),
      PhysiologicalReading.findOne({ userId }).sort({ timestamp: -1 }),
    ]);

    const latestVitals = latestReading ? {
      heartRate: latestReading.heartRate,
      hrv: latestReading.hrv,
      spo2: latestReading.spo2,
      temperature: latestReading.temperature,
      systolicBP: latestReading.bloodPressure?.systolic,
      diastolicBP: latestReading.bloodPressure?.diastolic,
    } : {};

    // Evaluate multimodal AI
    const evaluation = evaluateMultimodalCheckup({
      visualBiomarkers,
      vocalBiomarkers,
      questionnaire,
      baseline,
      latestVitals,
    });

    let generatedAlert = null;

    // If urgent or monitor closely, generate an early warning alert
    if (evaluation.triageLevel === 'URGENT_EVALUATION' || evaluation.triageLevel === 'MONITOR_CLOSELY') {
      const alertLevel = evaluation.triageLevel === 'URGENT_EVALUATION' ? 'RED' : 'YELLOW';
      generatedAlert = await Alert.create({
        userId,
        alertLevel,
        title: `${alertLevel} Checkup Alert: ${evaluation.primaryPattern}`,
        summary: evaluation.patternSummary,
        earlyWarningScore: alertLevel === 'RED' ? 76 : 48,
        physiologicalTrendScore: alertLevel === 'RED' ? 42 : 68,
        confidence: evaluation.patternConfidence,
        affectedSignals: evaluation.contributingModalities.map((c) => ({
          signal: c.modality,
          currentValue: c.impactWeight,
          baselineValue: 0,
          percentChange: c.impactWeight,
          unit: 'score',
        })),
        recommendedNextAction: evaluation.recheckProtocol.recheckActions[0] || 'Rest and follow recheck schedule.',
        explainableAi: {
          whatHappened: evaluation.patternSummary,
          whyDetected: `Multimodal camera, microphone, and questionnaire fusion matched pattern: ${evaluation.primaryPattern}.`,
          howDifferentFromBaseline: 'Biomarkers diverged from standard equilibrium during clinical scan.',
          contributingFactors: evaluation.contributingModalities.map((c) => ({
            factor: c.modality,
            weightPercent: c.impactWeight,
            observation: c.observation,
          })),
          practicalGuidance: evaluation.recheckProtocol.hydrationAndRestAdvice,
        },
      });

      await Notification.create({
        userId,
        alertId: generatedAlert._id,
        title: `${alertLevel} Alert: BioSensing Scan Completed`,
        message: evaluation.patternSummary,
        type: 'alert',
        severity: alertLevel === 'RED' ? 'critical' : 'warning',
      });
    }

    // Save Multimodal Checkup Document
    const checkup = await MultimodalCheckup.create({
      userId,
      visualBiomarkers: visualBiomarkers || {},
      vocalBiomarkers: vocalBiomarkers || {},
      questionnaire: questionnaire || {},
      physiologicalSnapshot: latestVitals,
      patternAnalysis: {
        primaryPattern: evaluation.primaryPattern,
        patternCategory: evaluation.patternCategory,
        patternConfidence: evaluation.patternConfidence,
        patternSummary: evaluation.patternSummary,
        contributingModalities: evaluation.contributingModalities,
      },
      potentialConditionsToDiscuss: evaluation.potentialConditionsToDiscuss,
      recheckProtocol: evaluation.recheckProtocol,
      triageLevel: evaluation.triageLevel,
      alertGeneratedId: generatedAlert ? generatedAlert._id : null,
    });

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'DATA_INGESTION',
      resourceType: 'READING',
      details: {
        checkupId: checkup._id,
        pattern: evaluation.primaryPattern,
        triageLevel: evaluation.triageLevel,
      },
      req,
    });

    res.status(201).json({
      success: true,
      data: checkup,
    });
  } catch (err) {
    console.error('Checkup submission error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get checkup history
const getCheckupHistory = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user._id;
    const history = await MultimodalCheckup.find({ userId: targetUserId })
      .sort({ timestamp: -1 })
      .limit(20);

    res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get single checkup by ID
const getCheckupById = async (req, res) => {
  try {
    const checkup = await MultimodalCheckup.findById(req.params.id);
    if (!checkup) {
      return res.status(404).json({ success: false, message: 'Checkup record not found.' });
    }

    res.json({
      success: true,
      data: checkup,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  submitCheckup,
  getCheckupHistory,
  getCheckupById,
};
