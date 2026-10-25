/**
 * VitaBridge AI - Risk Scoring Engine
 * Categorizes multimodal risk into clinical early-warning tiers (GREEN, YELLOW, RED)
 * with confidence levels and sensitivity adjustments.
 */

const evaluateAlertLevel = (earlyWarningScore, userSensitivity = 'normal', deviations = []) => {
  // Threshold adjustments based on user preferences
  let yellowCutoff = 35;
  let redCutoff = 70;

  if (userSensitivity === 'high') {
    yellowCutoff = 28;
    redCutoff = 60;
  } else if (userSensitivity === 'low') {
    yellowCutoff = 45;
    redCutoff = 78;
  }

  // Any severe single signal anomaly (e.g. SpO2 < 92 or severe tachycardia/fever) automatically escalates
  const hasSevereAnomaly = deviations.some((d) => d.level === 'severe' && d.isRisky);

  let alertLevel = 'GREEN';
  if (hasSevereAnomaly || earlyWarningScore >= redCutoff) {
    alertLevel = 'RED';
  } else if (earlyWarningScore >= yellowCutoff || deviations.length >= 2) {
    alertLevel = 'YELLOW';
  }

  // Confidence computation based on signal volume & concordance
  let baseConfidence = 0.85;
  if (deviations.length >= 3) baseConfidence = 0.95;
  else if (deviations.length === 2) baseConfidence = 0.90;
  else if (deviations.length === 0) baseConfidence = 0.92;

  return {
    alertLevel,
    confidence: Number(baseConfidence.toFixed(2)),
    thresholdsUsed: { yellowCutoff, redCutoff },
  };
};

module.exports = {
  evaluateAlertLevel,
};
