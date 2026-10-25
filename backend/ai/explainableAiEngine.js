/**
 * VitaBridge AI - Explainable AI Engine
 * Translates complex statistical deviations and multimodal models into
 * transparent, compassionate, actionable plain-language explanations.
 * 
 * Strict Clinical Safety Guarantee:
 * - NO disease diagnoses (e.g. NEVER "You have pneumonia/COVID/hypertension")
 * - Focus strictly on physiological baseline deviations
 * - Clear, responsible next steps and disclaimer
 */

const generateExplanation = ({
  alertLevel,
  earlyWarningScore,
  contributingFactors,
  deviations,
  activeTrends,
}) => {
  // If GREEN alert (Nominal)
  if (alertLevel === 'GREEN') {
    return {
      whatHappened: 'All monitored physiological indicators align with your baseline.',
      whyDetected: 'Regular automated check confirmed that your heart rate, sleep, oxygenation, and temperature are within your normal individual ranges.',
      howDifferentFromBaseline: 'Zero significant deviations detected. Measurements match your personal weekly median.',
      contributingFactors: [],
      practicalGuidance: 'Keep maintaining your balanced daily routine, hydration, and restful sleep habits.',
    };
  }

  // Formatting contributing factor details
  const formattedFactors = contributingFactors.map((f) => ({
    factor: f.factor,
    weightPercent: f.weightPercent,
    observation: f.observation,
  }));

  // Build "WHAT happened"
  const primarySignals = deviations.map((d) => d.label).slice(0, 3);
  const whatHappened =
    alertLevel === 'RED'
      ? `A significant physiological deviation was detected across ${primarySignals.join(', ')}.`
      : `A noticeable variation from your standard baseline was observed in ${primarySignals.join(', ')}.`;

  // Build "WHY was it detected"
  const multiSignalNote = deviations.length > 1
    ? `Multiple biometrics (${deviations.length} distinct signals) diverged simultaneously from your personal baseline.`
    : `A single metric diverged outside your expected personal range.`;
  const trendNote = activeTrends && activeTrends.length > 0
    ? ` This corresponds with a recent multi-day pattern: ${activeTrends[0].title.toLowerCase()}.`
    : '';
  const whyDetected = `${multiSignalNote}${trendNote}`;

  // Build "HOW different is it"
  const differenceSnippets = deviations.map((d) => {
    const sign = d.percentChange > 0 ? '+' : '';
    return `${d.label}: ${sign}${d.percentChange}% difference (${d.currentValue} ${d.unit} vs baseline average of ${d.baselineMean} ${d.unit})`;
  });
  const howDifferentFromBaseline = differenceSnippets.join('; ');

  // Build "WHAT should the user consider doing" (Practical & Non-diagnostic)
  let practicalGuidance = '';
  if (alertLevel === 'RED') {
    practicalGuidance =
      'Take time to rest and avoid strenuous physical exertion. Hydrate well, re-measure your vitals in 30 to 60 minutes, and closely monitor how you feel. If you experience shortness of breath, chest discomfort, or persistent fever, contact your doctor or local health provider promptly.';
  } else {
    practicalGuidance =
      'Consider taking a break to rest, drinking plenty of water, and checking your measurements again later today. Review whether recent poor sleep, dehydration, or heightened stress could be factors. If you feel unwell or symptoms persist, consult a healthcare professional.';
  }

  return {
    whatHappened,
    whyDetected,
    howDifferentFromBaseline,
    contributingFactors: formattedFactors,
    practicalGuidance,
  };
};

module.exports = {
  generateExplanation,
};
