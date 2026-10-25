const PhysiologicalReading = require('../models/PhysiologicalReading');
const HealthBaseline = require('../models/HealthBaseline');
const Alert = require('../models/Alert');
const HealthTrend = require('../models/HealthTrend');
const CameraObservation = require('../models/CameraObservation');
const AudioObservation = require('../models/AudioObservation');
const RecheckSession = require('../models/RecheckSession');
const { ingestReading } = require('../services/readingService');
const { cleanAndNormalizeReading } = require('../middleware/validation');
const { logAuditEvent } = require('../middleware/audit');
const { assignEarlyWarningTier } = require('../services/ai/riskScoringService');

// Ingest single reading
const postReading = async (req, res) => {
  try {
    const cleaned = req.cleanedReading;
    const result = await ingestReading(cleaned, req.user);

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'DATA_INGESTION',
      resourceType: 'READING',
      details: { readingId: result.reading._id, alertLevel: result.alertLevel },
      req,
    });

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get readings by timeframe
const getReadings = async (req, res) => {
  try {
    const { timeframe = '7d' } = req.query;
    const targetUserId = req.query.patientId || req.user._id;

    let startDate = new Date();
    if (timeframe === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeframe === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeframe === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (timeframe === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    } else {
      startDate.setDate(startDate.getDate() - 7);
    }

    const readings = await PhysiologicalReading.find({
      userId: targetUserId,
      timestamp: { $gte: startDate },
    }).sort({ timestamp: 1 });

    res.json({
      success: true,
      timeframe,
      count: readings.length,
      data: readings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get high-level dashboard data (Section 15 Real-Time Dashboard)
const getDashboardData = async (req, res) => {
  try {
    const targetUserId = req.query.patientId || req.user._id;

    const [
      latestReading,
      baseline,
      activeAlerts,
      activeTrends,
      recentReadings,
      latestCamera,
      latestAudio,
      latestRecheck,
    ] = await Promise.all([
      PhysiologicalReading.findOne({ userId: targetUserId }).sort({ timestamp: -1 }),
      HealthBaseline.findOne({ userId: targetUserId }),
      Alert.find({ userId: targetUserId, status: 'active' }).sort({ createdAt: -1 }),
      HealthTrend.find({ userId: targetUserId, isCurrent: true }).sort({ createdAt: -1 }),
      PhysiologicalReading.find({ userId: targetUserId }).sort({ timestamp: -1 }).limit(10),
      CameraObservation.findOne({ userId: targetUserId }).sort({ timestamp: -1 }),
      AudioObservation.findOne({ userId: targetUserId }).sort({ timestamp: -1 }),
      RecheckSession.findOne({ userId: targetUserId }).sort({ startedAt: -1 }),
    ]);

    // Compute Early Warning Score and Pattern Tier (GREEN, YELLOW, ORANGE, RED)
    let earlyWarningScore = 15;
    let physiologicalTrendScore = 88;

    if (activeAlerts.length > 0) {
      const topAlert = activeAlerts[0];
      earlyWarningScore = topAlert.earlyWarningScore || 45;
      physiologicalTrendScore = topAlert.physiologicalTrendScore || 65;
    }

    const tierInfo = assignEarlyWarningTier(earlyWarningScore);

    // Section 15 Live Sensing indicators
    const liveSensing = {
      camera: latestCamera ? 'Active' : 'Off',
      microphone: latestAudio ? 'Active' : 'Off',
      audioStatus: latestAudio?.eventType === 'cough_like' ? 'Processing' : 'Listening',
      heartRate: latestReading?.heartRate || baseline?.heartRate?.mean || 72,
      spo2: latestReading?.spo2 || baseline?.spo2?.mean || 98,
      temperature: latestReading?.temperature || baseline?.temperature?.mean || 36.6,
      activity: latestReading?.steps && latestReading.steps < 3500 ? 'Low Activity' : 'Normal',
      sleepHours: latestReading?.sleepHours || baseline?.sleepHours?.mean || 7.2,
      overallPattern: tierInfo.label.toUpperCase(), // NORMAL, MONITOR, RECHECK, SEEK ATTENTION
      tier: tierInfo.tier,
      tierInfo,
      confidence: 88, // %
    };

    res.json({
      success: true,
      data: {
        healthStatus: tierInfo.label,
        earlyWarningScore,
        physiologicalTrendScore,
        tierInfo,
        liveSensing,
        latestReading,
        baseline,
        activeAlerts,
        activeTrends,
        latestCamera,
        latestAudio,
        latestRecheck,
        recentReadings: recentReadings.reverse(),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Batch import (CSV / JSON items)
const importReadings = async (req, res) => {
  try {
    const { readings } = req.body;
    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide an array of readings.' });
    }

    const inserted = [];
    for (const item of readings) {
      const cleaned = cleanAndNormalizeReading({
        ...item,
        userId: req.user._id,
        sourceType: item.sourceType || 'csv_import',
      });
      const reading = await PhysiologicalReading.create(cleaned);
      inserted.push(reading);
    }

    res.status(201).json({
      success: true,
      message: `Successfully imported ${inserted.length} health data records.`,
      count: inserted.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export user health data for privacy portability
const exportData = async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    const [readings, baseline, alerts, profile] = await Promise.all([
      PhysiologicalReading.find({ userId: req.user._id }).sort({ timestamp: 1 }),
      HealthBaseline.findOne({ userId: req.user._id }),
      Alert.find({ userId: req.user._id }),
      require('../models/Profile').findOne({ userId: req.user._id }),
    ]);

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'EXPORT_HEALTH_DATA',
      resourceType: 'READING',
      details: { format, count: readings.length },
      req,
    });

    if (format === 'csv') {
      let csv = 'Timestamp,HeartRate,HRV,SpO2,Temperature,RespiratoryRate,SystolicBP,DiastolicBP,SleepHours,ActivityLevel,StressLevel\n';
      readings.forEach((r) => {
        csv += `${r.timestamp.toISOString()},${r.heartRate || ''},${r.hrv || ''},${r.spo2 || ''},${r.temperature || ''},${r.respiratoryRate || ''},${r.bloodPressure?.systolic || ''},${r.bloodPressure?.diastolic || ''},${r.sleepHours || ''},${r.activityLevel || ''},${r.stressLevel || ''}\n`;
      });
      res.header('Content-Type', 'text/csv');
      res.attachment(`vitabridge_export_${req.user._id}.csv`);
      return res.send(csv);
    }

    res.json({
      success: true,
      exportTimestamp: new Date(),
      user: { id: req.user._id, email: req.user.email, name: req.user.name },
      profile,
      baseline,
      alerts,
      readings,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  postReading,
  getReadings,
  getDashboardData,
  importReadings,
  exportData,
};
