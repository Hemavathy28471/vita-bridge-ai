const ActivityObservation = require('../models/ActivityObservation');
const HealthBaseline = require('../models/HealthBaseline');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const { evaluateActivityTelemetry } = require('../services/ai/activityAnalysisService');

// Get activity status and deviations
const getActivityStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const [baseline, latestActivity, recentReadings] = await Promise.all([
      HealthBaseline.findOne({ userId }),
      ActivityObservation.findOne({ userId }).sort({ timestamp: -1 }),
      PhysiologicalReading.find({ userId }).sort({ timestamp: -1 }).limit(7),
    ]);

    // Current day steps from latest reading or activity observation
    const currentSteps = latestActivity?.stepCountToday || recentReadings[0]?.steps || 3200;
    const inactivity = latestActivity?.inactivityDurationMinutes || 120;
    const posture = latestActivity?.currentPosture || 'sitting';

    const evaluation = evaluateActivityTelemetry(
      {
        stepCountToday: currentSteps,
        inactivityDurationMinutes: inactivity,
        currentPosture: posture,
      },
      baseline,
      latestActivity?.userContextResponse || null
    );

    res.json({
      success: true,
      data: {
        evaluation,
        baselineSteps: baseline?.dailySteps || { mean: 8200, stdDev: 1200 },
        inactivityBaseline: baseline?.inactivityMinutes || { mean: 180, stdDev: 45 },
        currentSteps,
        inactivityDurationMinutes: inactivity,
        posture,
        recentDays: recentReadings.map((r) => ({
          date: r.timestamp,
          steps: r.steps || 0,
          activityLevel: r.activityLevel || 0,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Post context response to unusual activity prompt
const postActivityContext = async (req, res) => {
  try {
    const { context } = req.body; // 'resting' | 'unwell' | 'different_schedule' | 'recheck'
    const userId = req.user._id;

    const latest = await ActivityObservation.findOne({ userId }).sort({ timestamp: -1 });
    const baseline = await HealthBaseline.findOne({ userId });

    const updated = await ActivityObservation.create({
      userId,
      timestamp: new Date(),
      currentPosture: latest?.currentPosture || 'sitting',
      stepCountToday: latest?.stepCountToday || 3200,
      baselineExpectedSteps: baseline?.dailySteps?.mean || 8200,
      userContextResponse: context,
      contextProvidedAt: new Date(),
      isUnusualActivityDetected: context === 'unwell' || context === 'recheck',
    });

    const evaluation = evaluateActivityTelemetry(
      {
        stepCountToday: updated.stepCountToday,
        inactivityDurationMinutes: updated.inactivityDurationMinutes,
        currentPosture: updated.currentPosture,
      },
      baseline,
      context
    );

    res.json({
      success: true,
      message: 'Activity context recorded successfully.',
      evaluation,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getActivityStatus,
  postActivityContext,
};
