/**
 * activityAnalysisService.js
 * Dedicated Unusual Activity Engine:
 * Evaluates activity deficits, posture shifts, inactivity duration, and coordinates context prompts.
 */

function evaluateActivityTelemetry(activityData = {}, baseline = {}, userContext = null) {
  const steps = activityData.stepCountToday ?? 3500;
  const inactivityMins = activityData.inactivityDurationMinutes ?? 90;
  const posture = activityData.currentPosture || 'sitting';
  const baselineSteps = baseline?.dailySteps?.mean || 8200;
  const baselineInactivity = baseline?.inactivityMinutes?.mean || 180;

  const stepDeltaPercent = ((steps - baselineSteps) / baselineSteps) * 100;
  let isUnusual = false;
  let severity = 'normal';
  let reason = '';

  // Significant reduction in physical activity
  if (stepDeltaPercent < -50 && steps < 4000) {
    isUnusual = true;
    severity = 'significant_reduction';
    reason = `Daily activity (${steps.toLocaleString()} steps) is significantly below your typical baseline (${baselineSteps.toLocaleString()} steps).`;
  } else if (inactivityMins > 240) {
    isUnusual = true;
    severity = 'prolonged_sedentary';
    reason = `Extended sedentary inactivity detected (${Math.round(inactivityMins / 60)} hours continuous).`;
  }

  // Handle user context if already provided
  let contextInterpretation = 'Awaiting user context';
  let requiresRecheck = false;

  if (userContext === 'resting') {
    contextInterpretation = 'User confirmed planned restorative rest / recovery day.';
    isUnusual = false; // Resolved by user intent
  } else if (userContext === 'different_schedule') {
    contextInterpretation = 'User indicated travel, commute, or atypical work schedule.';
    isUnusual = false;
  } else if (userContext === 'unwell') {
    contextInterpretation = 'User reported feeling unwell. Multimodal screening recommended.';
    requiresRecheck = true;
  } else if (userContext === 'recheck') {
    contextInterpretation = 'User requested active multimodal health recheck.';
    requiresRecheck = true;
  }

  const promptOptions = [
    { id: 'resting', label: "I'm resting", description: 'Planned recovery or rest day' },
    { id: 'unwell', label: "I'm feeling unwell", description: 'Experiencing fatigue or symptoms' },
    { id: 'different_schedule', label: 'Different schedule', description: 'Travel, meetings, or routine change' },
    { id: 'recheck', label: 'Launch Recheck', description: 'Check physiological signals now' },
  ];

  return {
    isUnusualActivityDetected: isUnusual,
    severity,
    currentSteps: steps,
    baselineExpectedSteps: baselineSteps,
    deficitPercent: Math.round(stepDeltaPercent),
    inactivityMinutes: inactivityMins,
    posture,
    promptMessage: isUnusual
      ? `Your activity level is significantly lower than your usual pattern today (${Math.round(stepDeltaPercent)}%).`
      : null,
    promptOptions,
    userContextResponse: userContext,
    contextInterpretation,
    requiresRecheck,
  };
}

module.exports = {
  evaluateActivityTelemetry,
};
