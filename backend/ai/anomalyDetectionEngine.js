/**
 * VitaBridge AI - Anomaly Detection Engine
 * Evaluates physiological signals using statistical thresholding, Z-scores,
 * moving-window bounds, and discordance heuristics.
 */

const { evaluateDeviation } = require('./baselineEngine');

const METRIC_CONFIGS = {
  heartRate: { label: 'Heart Rate', unit: 'BPM', higherIsRisk: true, lowerIsRisk: true, weight: 1.2 },
  hrv: { label: 'Heart Rate Variability', unit: 'ms', higherIsRisk: false, lowerIsRisk: true, weight: 1.1 },
  spo2: { label: 'Blood Oxygen (SpO2)', unit: '%', higherIsRisk: false, lowerIsRisk: true, weight: 1.4 },
  temperature: { label: 'Body Temperature', unit: '°C', higherIsRisk: true, lowerIsRisk: true, weight: 1.3 },
  respiratoryRate: { label: 'Respiratory Rate', unit: 'br/min', higherIsRisk: true, lowerIsRisk: true, weight: 1.2 },
  systolicBP: { label: 'Systolic Blood Pressure', unit: 'mmHg', higherIsRisk: true, lowerIsRisk: true, weight: 1.0 },
  diastolicBP: { label: 'Diastolic Blood Pressure', unit: 'mmHg', higherIsRisk: true, lowerIsRisk: true, weight: 1.0 },
  sleepHours: { label: 'Sleep Duration', unit: 'hours', higherIsRisk: false, lowerIsRisk: true, weight: 0.9 },
  activityLevel: { label: 'Activity Level', unit: 'norm', higherIsRisk: false, lowerIsRisk: true, weight: 0.8 },
  stressLevel: { label: 'Stress Level', unit: 'norm', higherIsRisk: true, lowerIsRisk: false, weight: 0.8 },
};

/**
 * Detects anomalies across all physiological modalities for a given reading
 */
const detectAnomalies = (reading, baseline) => {
  if (!baseline) {
    return {
      hasAnomalies: false,
      anomalyCount: 0,
      deviations: [],
      severityScore: 0,
    };
  }

  const deviations = [];
  let aggregateAnomalyScore = 0;

  // Extract BP components if nested
  const flatReading = {
    ...reading,
    systolicBP: reading.bloodPressure ? reading.bloodPressure.systolic : reading.systolicBP,
    diastolicBP: reading.bloodPressure ? reading.bloodPressure.diastolic : reading.diastolicBP,
  };

  for (const [key, config] of Object.entries(METRIC_CONFIGS)) {
    const val = flatReading[key];
    const baseMetric = baseline[key];

    if (typeof val === 'number' && !isNaN(val) && baseMetric) {
      const dev = evaluateDeviation(val, baseMetric);
      const absZ = Math.abs(dev.zScore);

      // Check if direction indicates physiological stress
      const isRisky =
        (config.higherIsRisk && dev.zScore > 1.5) ||
        (config.lowerIsRisk && dev.zScore < -1.5);

      if (absZ >= 1.5) {
        let level = 'mild';
        if (absZ >= 3.0) level = 'severe';
        else if (absZ >= 2.0) level = 'moderate';

        const contribution = absZ * config.weight;
        aggregateAnomalyScore += contribution;

        deviations.push({
          metric: key,
          label: config.label,
          unit: config.unit,
          currentValue: dev.currentValue,
          baselineMean: dev.baselineMean,
          percentChange: dev.percentChange,
          zScore: dev.zScore,
          direction: dev.direction,
          level,
          isRisky,
        });
      }
    }
  }

  // Cross-modality Discordance Heuristics:
  // 1. High HR while sedentary (activity is low)
  if (
    flatReading.heartRate &&
    baseline.heartRate &&
    flatReading.heartRate > baseline.heartRate.mean * 1.15 &&
    (flatReading.activityLevel || 0) < 0.25
  ) {
    aggregateAnomalyScore += 2.5;
  }

  // 2. High Temperature + Elevated HR
  if (
    flatReading.temperature &&
    flatReading.temperature >= 37.8 &&
    flatReading.heartRate &&
    baseline.heartRate &&
    flatReading.heartRate > baseline.heartRate.mean
  ) {
    aggregateAnomalyScore += 3.0;
  }

  // 3. Dropping SpO2 (< 94% or > 3% below personal baseline)
  if (
    flatReading.spo2 &&
    baseline.spo2 &&
    (flatReading.spo2 < 94 || flatReading.spo2 < baseline.spo2.mean - 3)
  ) {
    aggregateAnomalyScore += 4.0;
  }

  return {
    hasAnomalies: deviations.length > 0,
    anomalyCount: deviations.length,
    deviations,
    severityScore: Number(aggregateAnomalyScore.toFixed(2)),
  };
};

module.exports = {
  detectAnomalies,
  METRIC_CONFIGS,
};
