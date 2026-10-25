const User = require('../models/User');
const Device = require('../models/Device');
const Alert = require('../models/Alert');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const AuditLog = require('../models/AuditLog');

// Get system health and high-level platform telemetry
const getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDevices,
      activeDevices,
      totalAlerts,
      redAlerts,
      yellowAlerts,
      totalReadingsCount,
      recentAuditLogs,
    ] = await Promise.all([
      User.countDocuments(),
      Device.countDocuments(),
      Device.countDocuments({ status: 'connected' }),
      Alert.countDocuments({ status: 'active' }),
      Alert.countDocuments({ alertLevel: 'RED', status: 'active' }),
      Alert.countDocuments({ alertLevel: 'YELLOW', status: 'active' }),
      PhysiologicalReading.countDocuments(),
      AuditLog.find().sort({ timestamp: -1 }).limit(15),
    ]);

    // Data ingestion rate (last 24h)
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const readings24h = await PhysiologicalReading.countDocuments({ timestamp: { $gte: past24h } });

    res.json({
      success: true,
      data: {
        systemStatus: 'Operational',
        uptimeSeconds: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        metrics: {
          totalUsers,
          totalDevices,
          activeDevices,
          totalReadingsCount,
          readings24h,
          totalActiveAlerts: totalAlerts,
          redAlerts,
          yellowAlerts,
        },
        servicesStatus: {
          database: 'Connected (Mongoose)',
          ingestionPipeline: 'Active / Nominal',
          aiTrendEngine: 'Active (Multimodal Fusion v1.0)',
          earlyWarningSocketServer: 'Online',
        },
        recentAuditLogs,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { action, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;

    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit));

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdminOverview,
  getAuditLogs,
};
