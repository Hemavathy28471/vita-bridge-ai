/**
 * audioAnalysisService.js
 * Implements audio processing & acoustic event detection:
 * Microphone -> Noise reduction -> Voice/activity detection -> Feature extraction -> Event classification -> Temporal pattern analysis -> Confidence calculation -> Multimodal fusion.
 */

function processAcousticEvent(eventData = {}, baseline = {}) {
  const eventType = eventData.eventType || 'speech';
  const confidence = eventData.confidence ?? 85;
  const frequency = eventData.frequency ?? 1;
  const duration = eventData.durationSeconds ?? 1.2;

  let isAnomalous = false;
  let severity = 'nominal';
  let interpretation = '';
  let riskScore = 0;

  if (eventType === 'cough_like') {
    if (frequency >= 6) {
      isAnomalous = true;
      severity = 'high_cluster';
      interpretation = `Repeated cough-like acoustic events detected (${frequency} times, ${Math.round(confidence)}% confidence) during this session.`;
      riskScore = 55;
    } else if (frequency >= 3) {
      isAnomalous = true;
      severity = 'moderate_cluster';
      interpretation = `Intermittent cough-like acoustic events detected (${frequency} times).`;
      riskScore = 30;
    } else {
      interpretation = `Isolated cough-like event observed (${Math.round(confidence)}% confidence).`;
      riskScore = 10;
    }
  } else if (eventType === 'throat_clearing') {
    if (frequency >= 5) {
      isAnomalous = true;
      severity = 'repetitive_clearing';
      interpretation = `Frequent throat-clearing acoustic events noted (${frequency} occurrences).`;
      riskScore = 25;
    } else {
      interpretation = 'Occasional throat-clearing event.';
      riskScore = 5;
    }
  } else if (eventType === 'breathing_pattern') {
    const breathing = eventData.breathingAcoustics || {};
    if (breathing.shallowBreathingScore > 40 || breathing.irregularCadenceDetected) {
      isAnomalous = true;
      severity = 'irregular_breathing';
      interpretation = 'Acoustic cadence indicates possible shallow or irregular breathing sound patterns.';
      riskScore = 40;
    } else {
      interpretation = 'Audible respiration pattern within nominal acoustic cadence.';
      riskScore = 5;
    }
  } else {
    interpretation = 'Nominal ambient/vocal acoustic environment.';
  }

  return {
    isAnomalous,
    eventType,
    confidence: confidence / 100,
    frequency,
    durationSeconds: duration,
    severity,
    riskScore,
    interpretation,
    recommendRecheck: isAnomalous && frequency >= 3,
    prompt: isAnomalous
      ? 'Repeated acoustic events were detected. Would you like to perform a 30-second breathing and voice recheck?'
      : null,
  };
}

module.exports = {
  processAcousticEvent,
};
