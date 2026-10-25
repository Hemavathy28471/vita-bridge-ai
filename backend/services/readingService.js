/**
 * VitaBridge AI - Physiological Reading Service
 * Coordinates reading ingestion, validation, anomaly evaluation,
 * multimodal risk scoring, alert dispatch, and baseline updates.
 */

const PhysiologicalReading = require('../models/PhysiologicalReading');
const HealthBaseline = require('../models/HealthBaseline');
const HealthTrend = require('../models/HealthTrend');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const { fuseModalities } = require('../ai/multimodalFusionEngine');
const { evaluateAlertLevel } = require('../ai/riskScoringEngine');
const { generateExplanation } = require('../ai/explainableAiEngine');
const { buildMetricBaseline } = require('../ai/baselineEngine');
const User = require('../models/User');

let ioInstance = null;
const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Process a cleaned physiological reading through the AI pipeline
 */
const ingestReading = async (cleanedData, user) => {
  // 1. Save reading
  const reading = await PhysiologicalReading.create(cleanedData);

  // 2. Fetch user's personalized baseline
  let baseline = await HealthBaseline.findOne({ userId: user._id });

  // If no baseline exists yet, initialize from this initial reading
  if (!baseline) {
    baseline = await initializeBaselineForUser(user._id, cleanedData);
  }

  // 3. Fetch active trends
  const activeTrends = await HealthTrend.find({ userId: user._id, isCurrent: true });

  // 4. Run Multimodal Fusion
  const fusionResult = fuseModalities(cleanedData, baseline, activeTrends);
  const { earlyWarningScore, physiologicalTrendScore, contributingFactors, anomalyResult } = fusionResult;

  // 5. Evaluate Risk & Alert Level
  const { alertLevel, confidence } = evaluateAlertLevel(
    earlyWarningScore,
    user.preferences?.alertSensitivity || 'normal',
    anomalyResult.deviations
  );

  let newAlert = null;

  // 6. Generate Alert if Yellow or Red
  if (alertLevel === 'YELLOW' || alertLevel === 'RED') {
    const explainableAi = generateExplanation({
      alertLevel,
      earlyWarningScore,
      contributingFactors,
      deviations: anomalyResult.deviations,
      activeTrends,
    });

    const affectedSignals = anomalyResult.deviations.map((d) => ({
      signal: d.label,
      currentValue: d.currentValue,
      baselineValue: d.baselineMean,
      percentChange: d.percentChange,
      unit: d.unit,
      zScore: d.zScore,
    }));

    const title =
      alertLevel === 'RED'
        ? `Attention: Notable physiological deviation detected`
        : `Monitoring: Mild variation from your personal baseline`;

    const summary = explainableAi.whatHappened;

    newAlert = await Alert.create({
      userId: user._id,
      alertLevel,
      title,
      summary,
      earlyWarningScore,
      physiologicalTrendScore,
      confidence,
      affectedSignals,
      baselineComparisonText: explainableAi.howDifferentFromBaseline,
      recommendedNextAction: explainableAi.practicalGuidance,
      explainableAi,
      status: 'active',
    });

    // Create Notification
    await Notification.create({
      userId: user._id,
      alertId: newAlert._id,
      title: `${alertLevel} Alert: Physiological Variation Detected`,
      message: summary,
      type: 'alert',
      severity: alertLevel === 'RED' ? 'critical' : 'warning',
      channels: [
        { channel: 'inApp', delivered: true },
        { channel: 'email', delivered: true },
      ],
    });
  }

  // 7. Adapt baseline gradually with reliable reading
  if (anomalyResult.severityScore < 3.0) {
    await adaptBaseline(baseline, cleanedData);
  }

  // 8. Real-time WebSocket emission
  if (ioInstance) {
    const payload = {
      reading,
      earlyWarningScore,
      physiologicalTrendScore,
      alertLevel,
      alert: newAlert,
      contributingFactors,
    };
    // Emit to user's private room
    ioInstance.to(`user_${user._id}`).emit('reading_received', payload);
    // Emit to caregiver room if authorized
    ioInstance.to(`caregiver_of_${user._id}`).emit('patient_reading_updated', payload);
  }

  return {
    reading,
    earlyWarningScore,
    physiologicalTrendScore,
    alertLevel,
    alert: newAlert,
    deviations: anomalyResult.deviations,
  };
};

/**
 * Initializes baseline if first-time user
 */
async function initializeBaselineForUser(userId, initialData) {
  const hr = initialData.heartRate || 72;
  const hrv = initialData.hrv || 45;
  const spo2 = initialData.spo2 || 98;
  const temp = initialData.temperature || 36.6;
  const resp = initialData.respiratoryRate || 15;
  const sys = initialData.bloodPressure?.systolic || 118;
  const dia = initialData.bloodPressure?.diastolic || 76;
  const sleep = initialData.sleepHours || 7.5;
  const act = initialData.activityLevel || 0.65;
  const stress = initialData.stressLevel || 0.28;

  const makeBase = (val, std = 3) => ({
    mean: val,
    median: val,
    stdDev: std,
    min: val - std * 2,
    max: val + std * 2,
    p10: val - std * 1.5,
    p25: val - std * 0.8,
    p75: val + std * 0.8,
    p90: val + std * 1.5,
    movingAverage7d: val,
    movingStdDev7d: std,
    sampleCount: 1,
    lastUpdated: new Date(),
  });

  return await HealthBaseline.create({
    userId,
    status: 'active',
    calibrationProgressPercent: 100,
    heartRate: makeBase(hr, 4),
    hrv: makeBase(hrv, 8),
    spo2: makeBase(spo2, 1.2),
    temperature: makeBase(temp, 0.3),
    respiratoryRate: makeBase(resp, 1.5),
    systolicBP: makeBase(sys, 6),
    diastolicBP: makeBase(dia, 5),
    sleepHours: makeBase(sleep, 0.8),
    activityLevel: makeBase(act, 0.15),
    stressLevel: makeBase(stress, 0.12),
  });
}

/**
 * Gradually adapts baseline metrics
 */
async function adaptBaseline(baseline, data) {
  const alpha = 0.03; // Conservative adaptation rate
  const adapt = (metric, newVal) => {
    if (!metric || typeof newVal !== 'number' || isNaN(newVal)) return;
    metric.mean = Number((metric.mean * (1 - alpha) + newVal * alpha).toFixed(2));
    metric.sampleCount = (metric.sampleCount || 0) + 1;
    metric.lastUpdated = new Date();
  };

  adapt(baseline.heartRate, data.heartRate);
  adapt(baseline.hrv, data.hrv);
  adapt(baseline.spo2, data.spo2);
  adapt(baseline.temperature, data.temperature);
  adapt(baseline.respiratoryRate, data.respiratoryRate);
  adapt(baseline.sleepHours, data.sleepHours);
  adapt(baseline.activityLevel, data.activityLevel);

  baseline.lastRecalculatedAt = new Date();
  await baseline.save();
}

module.exports = {
  ingestReading,
  setSocketIO,
  initializeBaselineForUser,
};
