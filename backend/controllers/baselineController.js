const HealthBaseline = require('../models/HealthBaseline');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const { buildMetricBaseline } = require('../ai/baselineEngine');

// Get personalized baseline
const getBaseline = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user._id;
    let baseline = await HealthBaseline.findOne({ userId: targetUserId });

    if (!baseline) {
      const { initializeBaselineForUser } = require('../services/readingService');
      baseline = await initializeBaselineForUser(targetUserId, {});
    }

    res.json({
      success: true,
      data: baseline,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Recalibrate baseline from historical window
const recalibrateBaseline = async (req, res) => {
  try {
    const targetUserId = req.user._id;
    const readings = await PhysiologicalReading.find({ userId: targetUserId }).sort({ timestamp: 1 });

    if (readings.length < 3) {
      return res.status(400).json({
        success: false,
        message: 'At least 3 valid readings required to recalibrate baseline.',
      });
    }

    let baseline = await HealthBaseline.findOne({ userId: targetUserId });
    if (!baseline) {
      const { initializeBaselineForUser } = require('../services/readingService');
      baseline = await initializeBaselineForUser(targetUserId, {});
    }

    const extract = (key) =>
      readings
        .map((r) => (r[key] !== undefined ? r[key] : r.bloodPressure ? r.bloodPressure[key] : undefined))
        .filter((v) => typeof v === 'number');

    baseline.heartRate = buildMetricBaseline(extract('heartRate'), baseline.heartRate);
    baseline.hrv = buildMetricBaseline(extract('hrv'), baseline.hrv);
    baseline.spo2 = buildMetricBaseline(extract('spo2'), baseline.spo2);
    baseline.temperature = buildMetricBaseline(extract('temperature'), baseline.temperature);
    baseline.respiratoryRate = buildMetricBaseline(extract('respiratoryRate'), baseline.respiratoryRate);
    baseline.systolicBP = buildMetricBaseline(extract('systolic'), baseline.systolicBP);
    baseline.diastolicBP = buildMetricBaseline(extract('diastolic'), baseline.diastolicBP);
    baseline.sleepHours = buildMetricBaseline(extract('sleepHours'), baseline.sleepHours);
    baseline.activityLevel = buildMetricBaseline(extract('activityLevel'), baseline.activityLevel);
    baseline.lastRecalculatedAt = new Date();
    baseline.status = 'active';

    await baseline.save();

    res.json({
      success: true,
      message: 'Personalized baseline successfully recalibrated.',
      data: baseline,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getBaseline,
  recalibrateBaseline,
};
