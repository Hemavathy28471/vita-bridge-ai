/**
 * explanationService.js
 * Generates the Explainable AI format ("Why am I seeing this?") per Section 13.
 */

function generateExplainableAiSummary({
  tier = 'YELLOW',
  affectedSignals = [],
  contributingFactors = [],
  audioInterpretation = null,
  activityDeficit = null,
}) {
  // 1. Why? (Quantitative differences vs personal baseline)
  let whyItems = [];
  if (affectedSignals && affectedSignals.length > 0) {
    affectedSignals.forEach((s) => {
      const sign = s.percentChange > 0 ? '+' : '';
      whyItems.push(`${s.name || s.signal}: ${sign}${s.percentChange}% vs baseline`);
    });
  }

  if (activityDeficit != null && activityDeficit < -20) {
    whyItems.push(`Activity: ${activityDeficit}%`);
  }

  if (audioInterpretation) {
    whyItems.push('Cough-like acoustic events: increased');
  }

  const whyText = whyItems.length > 0
    ? `Your recent data differs from your personal baseline:\n• ${whyItems.join('\n• ')}`
    : 'Your current sensory and physiological readings remain closely aligned with your personal baseline.';

  // 2. What does this mean?
  let meaningText = '';
  if (tier === 'RED') {
    meaningText = 'These signals demonstrate persistent, multi-modal deviations across cardiovascular, thermal, and behavioral parameters. They do not establish a specific medical diagnosis, but indicate significant systemic physiological change from your typical baseline.';
  } else if (tier === 'ORANGE') {
    meaningText = 'Several sensory and physiological markers show notable differences from your standard baseline. While these shifts can occur with fatigue, acute physical stress, or transient illness, an active recheck is advised to confirm whether they persist.';
  } else if (tier === 'YELLOW') {
    meaningText = 'One or more signals differ moderately from your usual pattern. This frequently reflects poor sleep, minor fatigue, or schedule alterations rather than an acute medical event.';
  } else {
    meaningText = 'Your physiological and sensory parameters are in nominal equilibrium with your learned baseline range.';
  }

  // 3. What should I do?
  let actionText = '';
  if (tier === 'RED') {
    actionText = 'Please consider contacting a healthcare professional for a medical evaluation. If you are experiencing acute pain, severe shortness of breath, dizziness, or emergency symptoms, seek immediate emergency medical care.';
  } else if (tier === 'ORANGE') {
    actionText = 'Perform a 30-second health recheck in the app and monitor how you feel over the next few hours. Rest and ensure adequate hydration.';
  } else if (tier === 'YELLOW') {
    actionText = 'Consider performing a health recheck later today. Review your sleep and hydration, and avoid excessive physical strain.';
  } else {
    actionText = 'Continue your regular healthy routine and wear your connected sensors for ongoing baseline monitoring.';
  }

  return {
    why: whyText,
    whatDoesThisMean: meaningText,
    whatShouldIDo: actionText,
    contributingFactors: contributingFactors.length > 0 ? contributingFactors : [
      { factor: 'Cardiovascular Dynamics', weightPercent: 40, observation: 'Heart rate variations' },
      { factor: 'Acoustic / Vocal Biomarkers', weightPercent: 30, observation: 'Acoustic energy & cadence' },
      { factor: 'Daily Behavioral Rhythm', weightPercent: 30, observation: 'Steps & inactivity duration' },
    ],
  };
}

module.exports = {
  generateExplainableAiSummary,
};
