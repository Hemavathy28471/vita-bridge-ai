/**
 * VitaBridge AI - Multimodal Fusion Engine
 * Fuses 7 physiological and behavioral modalities into composite scores:
 * - Physiological Trend Score (0-100, higher = closer to optimal personal baseline)
 * - Early Warning Score (0-100, higher = higher deviation and physiological stress)
 */

const { detectAnomalies } = require('./anomalyDetectionEngine');

const MODALITY_WEIGHTS = {
  cardiovascular: 0.25, // Heart Rate & HRV
  oxygenation: 0.20,    // SpO2
  temperature: 0.15,    // Body Temp
  respiratory: 0.15,    // Respiratory Rate
  sleepAndRest: 0.10,   // Sleep duration & quality
  activityLevel: 0.05,  // Daily steps & activity
  symptomsReported: 0.10, // User-reported symptoms
};

/**
 * Computes multimodal fusion and returns scores with contributing factors
 */
const fuseModalities = (reading, baseline, activeTrends = []) => {
  if (!baseline) {
    return {
      earlyWarningScore: 10,
      physiologicalTrendScore: 90,
      contributingFactors: [],
      dominantModality: 'cardiovascular',
    };
  }

  const anomalyResult = detectAnomalies(reading, baseline);
  const deviations = anomalyResult.deviations;
  const contributingFactors = [];

  let rawRisk = 0;

  // 1. Cardiovascular Modality (HR + HRV)
  const hrDev = deviations.find((d) => d.metric === 'heartRate');
  const hrvDev = deviations.find((d) => d.metric === 'hrv');
  let cardioRisk = 0;
  if (hrDev) {
    const hrImpact = Math.min(40, Math.abs(hrDev.zScore) * 12);
    cardioRisk += hrImpact;
    contributingFactors.push({
      modality: 'cardiovascular',
      factor: 'Resting Heart Rate',
      observation: `${Math.abs(hrDev.percentChange)}% ${hrDev.direction === 'increasing' ? 'above' : 'below'} personal baseline (${hrDev.currentValue} vs ${hrDev.baselineMean} BPM)`,
      weightPercent: 25,
      zScore: hrDev.zScore,
    });
  }
  if (hrvDev && hrvDev.direction === 'decreasing') {
    const hrvImpact = Math.min(30, Math.abs(hrvDev.zScore) * 10);
    cardioRisk += hrvImpact;
    contributingFactors.push({
      modality: 'cardiovascular',
      factor: 'Heart Rate Variability',
      observation: `Suppressed HRV (${Math.abs(hrvDev.percentChange)}% below baseline, indicating autonomic strain)`,
      weightPercent: 15,
      zScore: hrvDev.zScore,
    });
  }
  rawRisk += Math.min(100, cardioRisk) * MODALITY_WEIGHTS.cardiovascular;

  // 2. Oxygenation Modality (SpO2)
  const spo2Dev = deviations.find((d) => d.metric === 'spo2');
  if (spo2Dev) {
    const spo2Impact = Math.min(100, Math.abs(spo2Dev.zScore) * 28 + (spo2Dev.currentValue < 94 ? 30 : 0));
    rawRisk += spo2Impact * MODALITY_WEIGHTS.oxygenation;
    contributingFactors.push({
      modality: 'oxygenation',
      factor: 'Blood Oxygen (SpO2)',
      observation: `Oxygen saturation dip to ${spo2Dev.currentValue}% (${Math.abs(spo2Dev.percentChange)}% change from personal normal)`,
      weightPercent: 20,
      zScore: spo2Dev.zScore,
    });
  }

  // 3. Thermal Modality (Temperature)
  const tempDev = deviations.find((d) => d.metric === 'temperature');
  if (tempDev && tempDev.direction === 'increasing') {
    const tempImpact = Math.min(100, Math.abs(tempDev.zScore) * 25 + (tempDev.currentValue >= 38.0 ? 35 : 0));
    rawRisk += tempImpact * MODALITY_WEIGHTS.temperature;
    contributingFactors.push({
      modality: 'temperature',
      factor: 'Body Temperature',
      observation: `Elevated temperature to ${tempDev.currentValue}°C (baseline ${tempDev.baselineMean}°C)`,
      weightPercent: 15,
      zScore: tempDev.zScore,
    });
  }

  // 4. Respiratory Modality
  const respDev = deviations.find((d) => d.metric === 'respiratoryRate');
  if (respDev) {
    const respImpact = Math.min(100, Math.abs(respDev.zScore) * 20);
    rawRisk += respImpact * MODALITY_WEIGHTS.respiratory;
    contributingFactors.push({
      modality: 'respiratory',
      factor: 'Respiratory Rate',
      observation: `Breathing rate shifted to ${respDev.currentValue} breaths/min (baseline ${respDev.baselineMean})`,
      weightPercent: 15,
      zScore: respDev.zScore,
    });
  }

  // 5. Sleep & Rest Modality
  const sleepDev = deviations.find((d) => d.metric === 'sleepHours');
  if (sleepDev && sleepDev.direction === 'decreasing') {
    const sleepImpact = Math.min(100, Math.abs(sleepDev.zScore) * 15);
    rawRisk += sleepImpact * MODALITY_WEIGHTS.sleepAndRest;
    contributingFactors.push({
      modality: 'sleep',
      factor: 'Sleep Duration',
      observation: `Sleep duration was ${sleepDev.currentValue}h (${Math.abs(sleepDev.percentChange)}% below normal rest pattern)`,
      weightPercent: 10,
      zScore: sleepDev.zScore,
    });
  }

  // 6. Activity Modality
  const actDev = deviations.find((d) => d.metric === 'activityLevel');
  if (actDev && actDev.direction === 'decreasing') {
    const actImpact = Math.min(100, Math.abs(actDev.zScore) * 12);
    rawRisk += actImpact * MODALITY_WEIGHTS.activityLevel;
    contributingFactors.push({
      modality: 'activity',
      factor: 'Daily Activity',
      observation: `Movement and steps decreased by ${Math.abs(actDev.percentChange)}% from your normal volume`,
      weightPercent: 5,
      zScore: actDev.zScore,
    });
  }

  // 7. Symptoms Reported
  if (reading.symptoms && reading.symptoms.length > 0) {
    const severeCount = reading.symptoms.filter((s) => s.severity === 'severe').length;
    const modCount = reading.symptoms.filter((s) => s.severity === 'moderate').length;
    const symptomScore = Math.min(100, severeCount * 45 + modCount * 25 + reading.symptoms.length * 10);

    rawRisk += symptomScore * MODALITY_WEIGHTS.symptomsReported;
    contributingFactors.push({
      modality: 'symptoms',
      factor: 'Reported Symptoms',
      observation: `${reading.symptoms.map((s) => `${s.name} (${s.severity})`).join(', ')}`,
      weightPercent: 10,
      zScore: 2.0,
    });
  }

  // Trend amplifier: If 2 or more multi-day patterns exist, bump risk slightly
  if (activeTrends && activeTrends.length >= 2) {
    rawRisk = rawRisk * 1.15;
  }

  // Calculate clamped scores
  const earlyWarningScore = Math.min(100, Math.max(0, Math.round(rawRisk)));
  // Physiological Trend Score: Inverse of risk, calibrated from 100 down to 0
  const physiologicalTrendScore = Math.min(100, Math.max(0, Math.round(100 - earlyWarningScore * 0.85)));

  // Identify dominant modality contributing to early warning
  let dominantModality = 'cardiovascular';
  if (contributingFactors.length > 0) {
    const sorted = [...contributingFactors].sort((a, b) => (b.weightPercent || 0) - (a.weightPercent || 0));
    dominantModality = sorted[0].modality;
  }

  return {
    earlyWarningScore,
    physiologicalTrendScore,
    contributingFactors,
    dominantModality,
    anomalyResult,
  };
};

module.exports = {
  fuseModalities,
  MODALITY_WEIGHTS,
};
