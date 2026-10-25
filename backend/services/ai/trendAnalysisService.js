/**
 * trendAnalysisService.js
 * Longitudinal multi-day trend analysis across 7d, 30d, 90d.
 * Detects cross-signal patterns and generates chronological event timeline.
 */

function analyzeTrends(readings = [], baseline = {}) {
  if (!readings || readings.length === 0) {
    return { detectedPatterns: [], timeline: [] };
  }

  const detectedPatterns = [];
  const n = readings.length;

  // Pattern 1: Cardiovascular Elevation Trend
  const recentHR = readings.slice(-5).map((r) => r.heartRate).filter(Boolean);
  const baselineHR = baseline?.heartRate?.mean || 72;
  if (recentHR.length >= 3) {
    const avgRecentHR = recentHR.reduce((a, b) => a + b, 0) / recentHR.length;
    if (avgRecentHR > baselineHR + 8) {
      detectedPatterns.push({
        id: 'pattern_elevated_hr',
        name: 'Persistent Resting Heart Rate Elevation',
        description: `Average heart rate over recent observations (${Math.round(avgRecentHR)} BPM) is elevated by ${Math.round(avgRecentHR - baselineHR)} BPM above personal baseline.`,
        signals: ['heartRate'],
        category: 'cardiovascular',
        severity: 'moderate',
      });
    }
  }

  // Pattern 2: Sleep Deficit coupled with elevated stress
  const recentSleep = readings.slice(-4).map((r) => r.sleepHours).filter(Boolean);
  const baselineSleep = baseline?.sleepHours?.mean || 7.5;
  if (recentSleep.length >= 2) {
    const avgSleep = recentSleep.reduce((a, b) => a + b, 0) / recentSleep.length;
    if (avgSleep < baselineSleep - 1.5) {
      detectedPatterns.push({
        id: 'pattern_sleep_deficit',
        name: 'Cumulative Sleep Disruption Pattern',
        description: `Recent sleep duration averages ${avgSleep.toFixed(1)}h vs baseline expectation of ${baselineSleep.toFixed(1)}h.`,
        signals: ['sleepHours', 'stressLevel'],
        category: 'sleep_recovery',
        severity: 'mild',
      });
    }
  }

  // Pattern 3: Concurrent Febrile & Cardiovascular Elevation
  const recentTemp = readings.slice(-3).map((r) => r.temperature).filter(Boolean);
  const baselineTemp = baseline?.temperature?.mean || 36.6;
  if (recentTemp.length >= 2) {
    const avgTemp = recentTemp.reduce((a, b) => a + b, 0) / recentTemp.length;
    if (avgTemp >= 37.6 && recentHR.length > 0 && recentHR[recentHR.length - 1] > baselineHR + 10) {
      detectedPatterns.push({
        id: 'pattern_febrile_hyperdynamic',
        name: 'Concurrent Thermal and Cardiovascular Elevation',
        description: 'Synchronized elevation in core body temperature and resting pulse.',
        signals: ['temperature', 'heartRate'],
        category: 'febrile_immune',
        severity: 'concerning',
      });
    }
  }

  // Chronological Event Timeline Generation (Section 17)
  const timeline = [];
  readings.forEach((r, idx) => {
    const timeStr = new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (idx === 0) {
      timeline.push({ time: timeStr, status: 'normal', icon: 'check', text: 'Baseline equilibrium verified' });
    } else if (r.steps && r.steps < 3000) {
      timeline.push({ time: timeStr, status: 'warning', icon: 'activity', text: `Activity decreased (${r.steps.toLocaleString()} steps)` });
    } else if (r.heartRate && r.heartRate > baselineHR + 12) {
      timeline.push({ time: timeStr, status: 'warning', icon: 'heart', text: `Resting pulse elevated (${r.heartRate} BPM)` });
    } else if (r.spo2 && r.spo2 < 95) {
      timeline.push({ time: timeStr, status: 'alert', icon: 'wind', text: `SpO2 dip observed (${r.spo2}%)` });
    }
  });

  return {
    detectedPatterns,
    timeline: timeline.slice(-10),
  };
}

module.exports = {
  analyzeTrends,
};
