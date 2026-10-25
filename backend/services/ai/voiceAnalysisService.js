/**
 * voiceAnalysisService.js
 * Analyzes voice dynamics: speech rate, pauses, pitch, voice energy, strain, hoarseness.
 */

function analyzeVoiceCharacteristics(vocalData = {}, baseline = {}) {
  const speechRate = vocalData.speechRateWpm ?? 135;
  const pauseRatio = vocalData.pauseDurationRatio ?? 0.18;
  const pitchHz = vocalData.pitchMeanHz ?? 180;
  const voiceStrain = vocalData.voiceStrainScore ?? 15;
  const hoarseness = vocalData.hoarsenessScore ?? 10;

  const baselineRate = baseline?.speechRate?.mean || 135;
  const rateDeltaPercent = ((speechRate - baselineRate) / baselineRate) * 100;

  let vocalAnomalies = [];
  let strainIndex = (voiceStrain + hoarseness) / 2;

  // Speech tempo reduction (fatigue or dyspnea marker)
  if (rateDeltaPercent < -25) {
    vocalAnomalies.push({
      metric: 'speechRate',
      issue: 'Significant slowing of speech tempo',
      current: speechRate,
      baseline: baselineRate,
      deltaPercent: Math.round(rateDeltaPercent),
    });
  }

  // Prolonged pauses
  if (pauseRatio > 0.30) {
    vocalAnomalies.push({
      metric: 'pauses',
      issue: 'Extended inter-word vocal pauses (respiratory or cognitive recovery)',
      current: Math.round(pauseRatio * 100) + '%',
    });
  }

  // Hoarseness / strain
  if (hoarseness > 45 || voiceStrain > 45) {
    vocalAnomalies.push({
      metric: 'vocalQuality',
      issue: 'Elevated acoustic hoarseness and vocal effort',
      hoarsenessScore: hoarseness,
      strainScore: voiceStrain,
    });
  }

  const isAnomalous = vocalAnomalies.length > 0;

  return {
    isAnomalous,
    speechRateWpm: speechRate,
    speechRateDeltaPercent: Math.round(rateDeltaPercent),
    pauseRatio,
    pitchHz,
    strainIndex: Math.round(strainIndex),
    anomalies: vocalAnomalies,
    summary: isAnomalous
      ? `Voice dynamics demonstrate ${vocalAnomalies.length} variation(s) relative to personal baseline.`
      : 'Vocal acoustic metrics are consistent with typical speaking patterns.',
  };
}

module.exports = {
  analyzeVoiceCharacteristics,
};
