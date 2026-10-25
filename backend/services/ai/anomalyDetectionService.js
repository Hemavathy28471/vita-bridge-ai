/**
 * anomalyDetectionService.js
 * Anomaly detector using statistical baseline bands and temporal persistence criteria.
 */

function detectAnomalies(currentObservations = {}, baseline = {}) {
  const anomalies = [];

  // HR check
  if (currentObservations.heartRate && baseline?.heartRate?.mean) {
    const mean = baseline.heartRate.mean;
    const std = baseline.heartRate.stdDev || 6;
    const z = (currentObservations.heartRate - mean) / std;
    if (Math.abs(z) >= 1.8) {
      anomalies.push({
        signal: 'heartRate',
        zScore: Number(z.toFixed(2)),
        deltaPercent: Math.round(((currentObservations.heartRate - mean) / mean) * 100),
        isSevere: Math.abs(z) >= 2.8,
      });
    }
  }

  // SpO2 check
  if (currentObservations.spo2 != null && currentObservations.spo2 <= 94) {
    anomalies.push({
      signal: 'spo2',
      value: currentObservations.spo2,
      isSevere: currentObservations.spo2 < 92,
    });
  }

  // Temperature check
  if (currentObservations.temperature != null && currentObservations.temperature >= 37.8) {
    anomalies.push({
      signal: 'temperature',
      value: currentObservations.temperature,
      isSevere: currentObservations.temperature >= 38.5,
    });
  }

  // Cough cluster check
  if (currentObservations.coughCount && currentObservations.coughCount >= 4) {
    anomalies.push({
      signal: 'cough_cluster',
      count: currentObservations.coughCount,
      isSevere: currentObservations.coughCount >= 8,
    });
  }

  return {
    hasAnomalies: anomalies.length > 0,
    count: anomalies.length,
    anomalies,
    requiresRecheck: anomalies.length >= 1,
  };
}

module.exports = {
  detectAnomalies,
};
