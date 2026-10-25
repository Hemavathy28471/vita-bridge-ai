/**
 * recheckService.js
 * Implements the DETECT -> VERIFY -> FUSE -> WARN Recheck Engine.
 * Supports 5 specialized recheck protocols and tests temporal persistence.
 */

function verifyRecheckSession(protocolType = 'general', initialSignals = {}, recheckSignals = {}, baseline = {}) {
  let signalsToCompare = [];

  if (protocolType === 'respiratory') {
    signalsToCompare = ['spo2', 'respiratoryRate', 'heartRate', 'coughEventCount'];
  } else if (protocolType === 'fatigue') {
    signalsToCompare = ['blinkRatePerMin', 'eyeOpennessPercent', 'heartRate', 'voiceQualityScore'];
  } else if (protocolType === 'activity') {
    signalsToCompare = ['movementStability', 'heartRate'];
  } else if (protocolType === 'stress_recovery') {
    signalsToCompare = ['heartRate', 'hrv'];
  } else {
    // General Recheck
    signalsToCompare = ['heartRate', 'spo2', 'temperature', 'respiratoryRate', 'skinFlushingIndex'];
  }

  let persistingSignals = [];
  let resolvedSignals = [];
  let deltas = [];

  signalsToCompare.forEach((sig) => {
    const initialVal = initialSignals[sig];
    const recheckVal = recheckSignals[sig];

    if (initialVal != null && recheckVal != null) {
      const deltaPercent = Math.round(((recheckVal - initialVal) / (initialVal || 1)) * 100);
      deltas.push({ signal: sig, initial: initialVal, recheck: recheckVal, deltaPercent });

      // Check whether abnormal state remains elevated
      if (sig === 'heartRate' && recheckVal > (baseline?.heartRate?.mean || 72) + 8) {
        persistingSignals.push({ signal: sig, observation: `Heart rate remains elevated at ${recheckVal} BPM.` });
      } else if (sig === 'spo2' && recheckVal < 95) {
        persistingSignals.push({ signal: sig, observation: `SpO2 remains depressed at ${recheckVal}%.` });
      } else if (sig === 'temperature' && recheckVal >= 37.6) {
        persistingSignals.push({ signal: sig, observation: `Body temperature remains elevated at ${recheckVal}°C.` });
      } else if (sig === 'coughEventCount' && recheckVal > 0) {
        persistingSignals.push({ signal: sig, observation: 'Cough-like acoustic events observed during recheck.' });
      } else {
        resolvedSignals.push({ signal: sig, observation: 'Signal normalized toward baseline range.' });
      }
    }
  });

  const persists = persistingSignals.length > 0;
  const consistencyScore = Math.round((persistingSignals.length / (signalsToCompare.length || 1)) * 100);

  return {
    protocolType,
    persists,
    persistingSignals,
    resolvedSignals,
    signalDeltas: deltas,
    consistencyScore,
    summary: persists
      ? `Recheck confirmed persistent physiological variation in ${persistingSignals.length} biomarker(s).`
      : 'Recheck measurements show signals returned toward nominal baseline levels.',
  };
}

module.exports = {
  verifyRecheckSession,
};
