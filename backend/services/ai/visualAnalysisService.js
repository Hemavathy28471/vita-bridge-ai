/**
 * visualAnalysisService.js
 * Analyzes video/camera visual features, facial landmarks, eye dynamics, posture, and rPPG metrics.
 */

function analyzeVisualFeatures(observation = {}, baseline = {}) {
  const eyeOpenness = observation.eyeOpennessPercent ?? 85;
  const blinkRate = observation.blinkRatePerMin ?? 16;
  const appearance = observation.facialAppearanceChanges || {};
  const flushing = appearance.skinFlushingIndex ?? 12;
  const pallor = appearance.skinPallorIndex ?? 0;
  const posture = observation.bodyPosture || {};
  const postureType = posture.postureType || 'sitting';
  const movement = posture.movementIntensity ?? 20;
  const rppg = observation.rppgPhysiological || {};

  let fatigueScore = 10;
  let visualAnomalies = [];

  // Blink rate comparison
  const baselineBlink = baseline?.blinkRate?.mean || 16;
  const blinkDeviation = Math.abs(blinkRate - baselineBlink);
  if (blinkRate > 26) {
    fatigueScore += 25;
    visualAnomalies.push({
      signal: 'blinkRate',
      issue: 'Elevated blink frequency (ocular strain)',
      value: blinkRate,
      baseline: baselineBlink,
    });
  } else if (blinkRate < 10) {
    fatigueScore += 30;
    visualAnomalies.push({
      signal: 'blinkRate',
      issue: 'Reduced blink frequency (drowsiness / fixation)',
      value: blinkRate,
      baseline: baselineBlink,
    });
  }

  // Eye openness
  if (eyeOpenness < 65) {
    fatigueScore += 35;
    visualAnomalies.push({
      signal: 'eyeOpenness',
      issue: 'Ptosis / reduced eye aperture',
      value: eyeOpenness,
    });
  }

  // Skin photometrics
  if (flushing > 55) {
    visualAnomalies.push({
      signal: 'skinFlushing',
      issue: 'Pronounced cutaneous flushing (potential febrile or vascular response)',
      value: flushing,
    });
  } else if (pallor < -35) {
    visualAnomalies.push({
      signal: 'skinPallor',
      issue: 'Noticeable cutaneous pallor (reduced peripheral microcirculation)',
      value: pallor,
    });
  }

  // Posture & movement
  let postureStability = posture.postureStabilityScore ?? 90;
  if (postureType === 'unusual' || movement < 5) {
    visualAnomalies.push({
      signal: 'posture',
      issue: 'Prolonged static posture or unusual biomechanical alignment',
      value: postureType,
    });
  }

  const isAnomalous = visualAnomalies.length > 0;
  const confidence = rppg.signalQualityScore ? rppg.signalQualityScore / 100 : 0.88;

  return {
    isAnomalous,
    fatigueScore: Math.min(100, fatigueScore),
    anomalies: visualAnomalies,
    rppgEstimatedPulse: rppg.estimatedPulseBpm || null,
    confidence,
    summary: isAnomalous
      ? `Visual analysis detected ${visualAnomalies.length} deviation(s) from expected facial/behavioral patterns.`
      : 'Visual signals align with healthy facial and postural baseline.',
  };
}

module.exports = {
  analyzeVisualFeatures,
};
