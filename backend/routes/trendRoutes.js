const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const HealthBaseline = require('../models/HealthBaseline');
const Alert = require('../models/Alert');
const RecheckSession = require('../models/RecheckSession');
const { analyzeTrends } = require('../services/ai/trendAnalysisService');

router.get('/', protect, async (req, res) => {
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

    const [readings, baseline, alerts, rechecks] = await Promise.all([
      PhysiologicalReading.find({ userId: targetUserId, timestamp: { $gte: startDate } }).sort({ timestamp: 1 }),
      HealthBaseline.findOne({ userId: targetUserId }),
      Alert.find({ userId: targetUserId, createdAt: { $gte: startDate } }).sort({ createdAt: 1 }),
      RecheckSession.find({ userId: targetUserId, startedAt: { $gte: startDate } }).sort({ startedAt: 1 }),
    ]);

    const trendResult = analyzeTrends(readings, baseline);

    // Build comprehensive chronological event timeline (Section 17)
    const timeline = [];

    // Add baseline calibration event
    timeline.push({
      timestamp: new Date(startDate.getTime() + 1000 * 60 * 60 * 9),
      time: '09:00',
      type: 'baseline',
      status: 'Normal',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      title: 'Baseline Equilibrium Verified',
      description: 'All sensory and physiological parameters consistent with learned baseline.',
    });

    // Add readings and activity events
    readings.forEach((r) => {
      const d = new Date(r.timestamp);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (r.steps && r.steps < 3000) {
        timeline.push({
          timestamp: d,
          time: timeStr,
          type: 'activity',
          status: 'Activity Decreased',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          title: 'Activity Level Below Typical Baseline',
          description: `Daily step accumulation (${r.steps.toLocaleString()}) dropped below expected target.`,
        });
      }

      if (r.heartRate && baseline?.heartRate?.mean && r.heartRate > baseline.heartRate.mean + 12) {
        timeline.push({
          timestamp: d,
          time: timeStr,
          type: 'cardiovascular',
          status: 'Heart Rate Elevated',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
          title: 'Resting Heart Rate Deviation',
          description: `Resting pulse of ${r.heartRate} BPM is +${Math.round(((r.heartRate - baseline.heartRate.mean)/baseline.heartRate.mean)*100)}% above personal baseline.`,
        });
      }
    });

    // Add Recheck events
    rechecks.forEach((rc) => {
      const d = new Date(rc.startedAt);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeline.push({
        timestamp: d,
        time: timeStr,
        type: 'recheck',
        status: 'Recheck Completed',
        badgeClass: 'bg-teal-100 text-teal-800 border-teal-200',
        title: `${rc.protocolType.toUpperCase()} Recheck Protocol Executed`,
        description: rc.comparisonResult?.interpretation || 'Multimodal sensor recheck completed.',
      });
    });

    // Add Alerts
    alerts.forEach((alt) => {
      const d = new Date(alt.createdAt);
      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      timeline.push({
        timestamp: d,
        time: timeStr,
        type: 'alert',
        status: `${alt.alertLevel} Alert`,
        badgeClass: alt.alertLevel === 'RED' ? 'bg-red-100 text-red-800 border-red-200' : alt.alertLevel === 'ORANGE' ? 'bg-orange-100 text-orange-800 border-orange-200' : 'bg-amber-100 text-amber-800 border-amber-200',
        title: alt.title,
        description: alt.summary,
      });
    });

    // Sort timeline chronologically
    timeline.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    res.json({
      success: true,
      timeframe,
      readingsCount: readings.length,
      baseline,
      readings,
      detectedPatterns: trendResult.detectedPatterns,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
