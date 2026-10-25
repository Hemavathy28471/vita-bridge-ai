/**
 * riskScoringService.js
 * Maps scores into 4 Early-Warning Tiers per Section 11:
 * GREEN (Normal), YELLOW (Monitor), ORANGE (Recheck), RED (Seek Attention).
 */

function assignEarlyWarningTier(earlyWarningScore = 15, isEmergencySymptom = false) {
  if (isEmergencySymptom || earlyWarningScore >= 75) {
    return {
      tier: 'RED',
      label: 'Seek Attention',
      color: '#ef4444',
      badgeClass: 'bg-red-100 text-red-800 border-red-200',
      tagline: 'Strong or persistent concerning pattern detected',
      message: 'Your measurements show a significant change from your usual pattern. Please consider contacting a healthcare professional. If you are experiencing severe or emergency symptoms, seek urgent medical care.',
      requiresDoctor: true,
      requiresEmergencyDisclaimer: true,
    };
  }

  if (earlyWarningScore >= 55) {
    return {
      tier: 'ORANGE',
      label: 'Recheck',
      color: '#f97316',
      badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
      tagline: 'Multiple unusual signals detected',
      message: 'Several measurements differ from your normal pattern. We recommend performing a recheck.',
      requiresDoctor: false,
      requiresRecheck: true,
    };
  }

  if (earlyWarningScore >= 30) {
    return {
      tier: 'YELLOW',
      label: 'Monitor',
      color: '#eab308',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      tagline: 'One or more signals differ from baseline',
      message: 'Your resting heart rate and activity level differ from your usual pattern. Consider rechecking later.',
      requiresDoctor: false,
      requiresRecheck: false,
    };
  }

  return {
    tier: 'GREEN',
    label: 'Normal',
    color: '#10b981',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    tagline: 'Signals are within expected pattern',
    message: 'Your current measurements are consistent with your usual pattern.',
    requiresDoctor: false,
    requiresRecheck: false,
  };
}

module.exports = {
  assignEarlyWarningTier,
};
