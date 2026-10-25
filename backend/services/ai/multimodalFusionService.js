/**
 * multimodalFusionService.js
 * Synthesizes all sensory modalities:
 * Camera + Microphone + Wearables + Activity + User Context + Personal Baseline ->
 * Early Warning Score (0 - 100) & Physiological Trend Score (0 - 100).
 */

function fuseMultimodalSignals({
  visualResult = {},
  audioResult = {},
  activityResult = {},
  physiologicalResult = {},
  userSymptoms = {},
  recheckPersistence = false,
}) {
  // Base weights for multimodal risk composition
  let riskScore = 10;
  let stabilityScore = 90;
  let contributingSignals = [];

  // Physiological contribution (weight: 35%)
  if (physiologicalResult.hasDeviations) {
    const physDev = physiologicalResult.deviationScore || 0;
    riskScore += (physDev / 100) * 35;
    stabilityScore -= (physDev / 100) * 30;
    physiologicalResult.deviations.forEach((d) => {
      contributingSignals.push({
        name: d.name,
        percentChange: d.percentChange,
        direction: d.direction,
      });
    });
  }

  // Audio / acoustic contribution (weight: 20%)
  if (audioResult.isAnomalous) {
    const audioRisk = audioResult.riskScore || 20;
    riskScore += (audioRisk / 100) * 20;
    stabilityScore -= 15;
    contributingSignals.push({
      name: 'Acoustic Events',
      detail: audioResult.interpretation,
    });
  }

  // Visual / facial contribution (weight: 15%)
  if (visualResult.isAnomalous) {
    const visualRisk = visualResult.fatigueScore || 15;
    riskScore += (visualRisk / 100) * 15;
    stabilityScore -= 12;
    contributingSignals.push({
      name: 'Visual Biomarkers',
      detail: visualResult.summary,
    });
  }

  // Activity / behavioral contribution (weight: 15%)
  if (activityResult.isUnusualActivityDetected && !['resting', 'different_schedule'].includes(activityResult.userContextResponse)) {
    riskScore += 18;
    stabilityScore -= 15;
    contributingSignals.push({
      name: 'Physical Activity Deficit',
      detail: `Activity is ${activityResult.deficitPercent}% below normal baseline.`,
    });
  }

  // User-reported symptoms (weight: 15%)
  if (userSymptoms.reportedFeverFeeling || userSymptoms.reportedDyspnea || (userSymptoms.reportedFatigue && userSymptoms.reportedFatigue >= 3)) {
    riskScore += 20;
    stabilityScore -= 15;
    contributingSignals.push({
      name: 'Patient Reported Context',
      detail: 'Subjective fatigue, fever sensation, or breathing discomfort noted.',
    });
  }

  // Multiplier if abnormality verified as persistent through recheck
  if (recheckPersistence) {
    riskScore = Math.min(100, Math.round(riskScore * 1.25));
    stabilityScore = Math.max(10, Math.round(stabilityScore * 0.8));
  }

  const finalEarlyWarningScore = Math.min(100, Math.max(5, Math.round(riskScore)));
  const finalTrendScore = Math.min(100, Math.max(10, Math.round(stabilityScore)));

  return {
    earlyWarningScore: finalEarlyWarningScore,
    physiologicalTrendScore: finalTrendScore,
    contributingSignals,
    signalCount: contributingSignals.length,
    confidence: 0.89,
  };
}

module.exports = {
  fuseMultimodalSignals,
};
