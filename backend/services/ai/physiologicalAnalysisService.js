/**
 * physiologicalAnalysisService.js
 * Ingests, normalizes, and evaluates physiological metrics against individual baselines.
 */

function evaluatePhysiologicalReading(reading = {}, baseline = {}) {
  const hr = reading.heartRate;
  const hrv = reading.hrv;
  const spo2 = reading.spo2;
  const temp = reading.temperature;
  const rr = reading.respiratoryRate;
  const bp = reading.bloodPressure || {};
  const sleep = reading.sleepHours;

  let deviations = [];
  let deviationScore = 0;

  // HR deviation
  if (hr != null && baseline?.heartRate?.mean) {
    const mean = baseline.heartRate.mean;
    const std = baseline.heartRate.stdDev || 6;
    const z = (hr - mean) / std;
    const percentChange = Math.round(((hr - mean) / mean) * 100);

    if (Math.abs(z) >= 1.8) {
      deviations.push({
        signal: 'heartRate',
        name: 'Heart Rate',
        current: hr,
        baseline: mean,
        percentChange,
        unit: 'BPM',
        zScore: Number(z.toFixed(2)),
        direction: z > 0 ? 'elevated' : 'depressed',
      });
      deviationScore += Math.abs(z) * 15;
    }
  }

  // SpO2 deviation
  if (spo2 != null) {
    const mean = baseline?.spo2?.mean || 98;
    if (spo2 <= 94) {
      const z = (spo2 - mean) / (baseline?.spo2?.stdDev || 1);
      deviations.push({
        signal: 'spo2',
        name: 'Oxygen Saturation (SpO2)',
        current: spo2,
        baseline: mean,
        percentChange: Math.round(((spo2 - mean) / mean) * 100),
        unit: '%',
        zScore: Number(z.toFixed(2)),
        direction: 'depressed',
      });
      deviationScore += (95 - spo2) * 18;
    }
  }

  // Body Temperature
  if (temp != null) {
    const mean = baseline?.temperature?.mean || 36.6;
    const std = baseline?.temperature?.stdDev || 0.3;
    const z = (temp - mean) / std;
    if (temp >= 37.8 || z >= 2.0) {
      deviations.push({
        signal: 'temperature',
        name: 'Body Temperature',
        current: temp,
        baseline: mean,
        percentChange: Math.round(((temp - mean) / mean) * 100),
        unit: '°C',
        zScore: Number(z.toFixed(2)),
        direction: 'elevated',
      });
      deviationScore += Math.abs(z) * 20;
    }
  }

  // Respiratory Rate
  if (rr != null) {
    const mean = baseline?.respiratoryRate?.mean || 15;
    const std = baseline?.respiratoryRate?.stdDev || 2;
    const z = (rr - mean) / std;
    if (Math.abs(z) >= 2.0) {
      deviations.push({
        signal: 'respiratoryRate',
        name: 'Respiratory Rate',
        current: rr,
        baseline: mean,
        percentChange: Math.round(((rr - mean) / mean) * 100),
        unit: 'br/min',
        zScore: Number(z.toFixed(2)),
        direction: z > 0 ? 'elevated' : 'depressed',
      });
      deviationScore += Math.abs(z) * 14;
    }
  }

  // Sleep
  if (sleep != null && baseline?.sleepHours?.mean) {
    const mean = baseline.sleepHours.mean;
    const delta = ((sleep - mean) / mean) * 100;
    if (delta < -25) {
      deviations.push({
        signal: 'sleep',
        name: 'Sleep Duration',
        current: sleep,
        baseline: mean,
        percentChange: Math.round(delta),
        unit: 'hours',
        direction: 'reduced',
      });
      deviationScore += 18;
    }
  }

  return {
    hasDeviations: deviations.length > 0,
    deviations,
    deviationScore: Math.min(100, Math.round(deviationScore)),
  };
}

module.exports = {
  evaluatePhysiologicalReading,
};
