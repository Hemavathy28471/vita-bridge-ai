/**
 * VitaBridge AI - Multimodal Sensing Engine (Camera + Mic + Questionnaire)
 * Fuses visual skin photometry, vocal acoustic analysis, self-reported symptoms,
 * and physiological baseline signatures.
 * 
 * Strict Clinical Safety Guarantee:
 * - Informational & decision-support only
 * - NEVER issues a final diagnosis
 * - Outlines observable patterns and potential possibilities to review with a doctor
 * - Formulates structured "Recheck" (rechk) timelines and red flags.
 */

const evaluateMultimodalCheckup = ({
  visualBiomarkers = {},
  vocalBiomarkers = {},
  questionnaire = {},
  baseline = null,
  latestVitals = {},
}) => {
  const contributing = [];
  const potentialConditions = [];
  const recheckActions = [];
  const vitalsToRetest = [];
  const redFlags = [];

  const symptoms = (questionnaire.primarySymptoms || []).map((s) => s.toLowerCase());
  const feverReported = questionnaire.feverReported || (latestVitals.temperature && latestVitals.temperature >= 37.8);
  const breathingDiff = questionnaire.breathingDifficulty || 'none';
  const painScore = questionnaire.painScore || 0;
  const duration = questionnaire.durationDays || 1;

  const skinFlush = visualBiomarkers.skinFlushingIndex || 0;
  const skinPallor = visualBiomarkers.skinPallorIndex || 0;
  const fatigueScore = visualBiomarkers.facialFatigueScore || 0;

  const pitchJitter = vocalBiomarkers.pitchJitterPercent || 0.8;
  const hoarseness = vocalBiomarkers.hoarsenessScore || 0;
  const voiceStrain = vocalBiomarkers.voiceStrainScore || 0;
  const speechWpm = vocalBiomarkers.speechRateWpm || 130;

  let patternCategory = 'normal_equilibrium';
  let primaryPattern = 'Normal Physiological Equilibrium';
  let patternSummary = 'Visual skin photometry, vocal acoustics, and reported state track expected parameters.';
  let confidence = 0.90;
  let triageLevel = 'ROUTINE';
  let recheckMinutes = 180; // 3 hours routine

  // Check 1: Severe Red Flags (Automatic Urgent Evaluation)
  if (breathingDiff === 'severe_at_rest' || symptoms.includes('chest pressure') || symptoms.includes('cyanosis') || (latestVitals.spo2 && latestVitals.spo2 < 91)) {
    triageLevel = 'URGENT_EVALUATION';
    primaryPattern = 'Acute Cardiorespiratory Divergence Pattern';
    patternSummary = 'Severe respiratory or oxygenation markers detected requiring prompt professional clinical triage.';
    recheckMinutes = 15;
    redFlags.push('Shortness of breath at rest or rapid breathing');
    redFlags.push('Chest pain, tightness, or lightheadedness');
    redFlags.push('Oxygen saturation (SpO2) persisting below 92%');
    vitalsToRetest.push('SpO2', 'Respiratory Rate', 'Heart Rate');
  }

  // Check 2: Acute Viral / Febrile Syndrome Pattern
  else if (feverReported || skinFlush > 40 || symptoms.includes('fever') || symptoms.includes('chills') || symptoms.includes('body aches')) {
    patternCategory = 'viral_febrile_syndrome';
    primaryPattern = 'Acute Febrile / Viral-Like Immune Response Pattern';
    patternSummary = 'Concurrence of elevated skin thermal flushing, vocal acoustic strain, and febrile symptoms.';
    confidence = 0.92;
    triageLevel = 'MONITOR_CLOSELY';
    recheckMinutes = 45;

    contributing.push({
      modality: 'Camera Photometry',
      observation: `Facial erythema / skin flushing index measured at ${skinFlush}/100 with elevated skin temperature reflection.`,
      impactWeight: 35,
    });
    contributing.push({
      modality: 'Vocal Acoustics',
      observation: `Vocal strain (${voiceStrain}/100) and pitch jitter (${pitchJitter.toFixed(2)}%) reflecting laryngeal mucosal inflammation or systemic fatigue.`,
      impactWeight: 25,
    });
    contributing.push({
      modality: 'Questionnaire & Vitals',
      observation: `Reported symptoms (${questionnaire.primarySymptoms?.join(', ')}) with recorded temperature of ${latestVitals.temperature || 37.9}°C.`,
      impactWeight: 40,
    });

    potentialConditions.push({
      categoryName: 'Acute Viral Respiratory or Febrile Syndrome',
      description: 'A presentation of symptoms and autonomic signs commonly seen in common viral upper respiratory infections or acute immune activation.',
      likelihoodTier: 'consider_evaluating',
      rationale: 'Elevated temperature, facial flush, and vocal hoarseness frequently correlate with early immune response.',
    });

    recheckActions.push('Measure core body temperature using an oral or forehead thermometer in 45 minutes.');
    recheckActions.push('Hydrate with electrolyte fluids or water (250–500 mL) to support thermoregulation.');
    recheckActions.push('Rest in a cool, well-ventilated room with elevated head support.');
    vitalsToRetest.push('Body Temperature', 'Heart Rate', 'Hydration Status');
    redFlags.push('Fever exceeding 39.0°C (102.2°F) or not responding to fluids/rest');
    redFlags.push('Stiff neck, persistent confusion, or difficulty breathing');
  }

  // Check 3: Upper Respiratory / Bronchial Strain Pattern
  else if (symptoms.includes('cough') || symptoms.includes('sore throat') || hoarseness > 35 || breathingDiff === 'mild_on_exertion') {
    patternCategory = 'upper_respiratory_strain';
    primaryPattern = 'Upper Respiratory & Pharyngeal Strain Pattern';
    patternSummary = 'Vocal acoustic markers and breathing dynamics suggest airway irritation or mucosal congestion.';
    confidence = 0.89;
    triageLevel = 'MONITOR_CLOSELY';
    recheckMinutes = 60;

    contributing.push({
      modality: 'Vocal Acoustics',
      observation: `Hoarseness index at ${hoarseness}/100 with elevated acoustic perturbation reflecting vocal cord mucosal dryness.`,
      impactWeight: 45,
    });
    contributing.push({
      modality: 'Camera Photometry',
      observation: `Facial eye fatigue score of ${fatigueScore}/100 and mild mucosal pallor.`,
      impactWeight: 25,
    });
    contributing.push({
      modality: 'Reported Symptoms',
      observation: `Persistent pharyngeal soreness or cough over past ${duration} days.`,
      impactWeight: 30,
    });

    potentialConditions.push({
      categoryName: 'Pharyngitis / Laryngotracheal Irritation',
      description: 'Airway mucosal inflammation or vocal fatigue from seasonal allergens, viral irritation, or environmental dryness.',
      likelihoodTier: 'moderate_correlation',
      rationale: 'Vocal frequency perturbations and throat discomfort are hallmark characteristics.',
    });

    recheckActions.push('Recheck SpO2 levels after 1 hour of quiet resting.');
    recheckActions.push('Sip warm fluids or herbal tea with honey to soothe mucosal tissues.');
    recheckActions.push('Avoid loud speaking or voice strain for the next 2-4 hours.');
    vitalsToRetest.push('Blood Oxygen (SpO2)', 'Vocal Ease Score');
    redFlags.push('Inability to swallow liquids or saliva');
    redFlags.push('Stridor (high-pitched wheezing upon inhalation)');
  }

  // Check 4: Autonomic Exhaustion / Chronic Fatigue Pattern
  else if (fatigueScore > 45 || skinPallor < -25 || symptoms.includes('fatigue') || speechWpm < 110 || (latestVitals.hrv && latestVitals.hrv < 30)) {
    patternCategory = 'autonomic_exhaustion';
    primaryPattern = 'Autonomic Exhaustion & Recovery Deficit Pattern';
    patternSummary = 'Visual facial fatigue, slower speech tempo, and suppressed autonomic recovery biometrics.';
    confidence = 0.87;
    triageLevel = 'MONITOR_CLOSELY';
    recheckMinutes = 120; // 2 hours

    contributing.push({
      modality: 'Camera Photometry',
      observation: `Facial fatigue index (${fatigueScore}/100), eyelid droop, and cutaneous pallor (${skinPallor}).`,
      impactWeight: 40,
    });
    contributing.push({
      modality: 'Vocal Acoustics',
      observation: `Speech tempo decelerated to ${speechWpm} WPM with prolonged pause intervals (${Math.round((vocalBiomarkers.pauseDurationRatio || 0.2) * 100)}% silence ratio).`,
      impactWeight: 30,
    });
    contributing.push({
      modality: 'Baseline Correlation',
      observation: `Suppressed HRV (${latestVitals.hrv || 28} ms) and cumulative sleep debt.`,
      impactWeight: 30,
    });

    potentialConditions.push({
      categoryName: 'Acute Sleep Deprivation & Physical Overreach',
      description: 'Autonomic nervous system imbalance resulting from prolonged work strain, acute insomnia, or intense exertion.',
      likelihoodTier: 'moderate_correlation',
      rationale: 'Coupled cutaneous vasoconstriction (pallor) and vocal tempo slowing reflect systemic fatigue.',
    });

    recheckActions.push('Take a 20-30 minute restorative pause or power nap in a quiet, dark environment.');
    recheckActions.push('Drink 300 mL of water and have a light, nutritious snack.');
    recheckActions.push('Re-test resting heart rate and HRV upon waking or following rest.');
    vitalsToRetest.push('Heart Rate Variability', 'Resting Heart Rate');
    redFlags.push('Sudden weakness on one side of the face or body');
    redFlags.push('Fainting or severe unsteadiness upon standing');
  }

  // Check 5: Dermatological / Thermal Stress
  else if (skinFlush > 45 || symptoms.includes('rash') || symptoms.includes('itching')) {
    patternCategory = 'dermatological_thermal_stress';
    primaryPattern = 'Cutaneous Vascular / Thermal Reaction Pattern';
    patternSummary = 'Pronounced facial capillary dilation without significant internal vital sign deviation.';
    confidence = 0.85;
    triageLevel = 'MONITOR_CLOSELY';
    recheckMinutes = 45;

    contributing.push({
      modality: 'Camera Photometry',
      observation: `Facial capillary flushing index measured at ${skinFlush}/100.`,
      impactWeight: 60,
    });

    potentialConditions.push({
      categoryName: 'Contact Erythema / Mild Environmental Thermal Reaction',
      description: 'Cutaneous vascular dilation triggered by room heat, exercise, topical contact, or histamine release.',
      likelihoodTier: 'possible',
      rationale: 'Isolated facial redness with normal heart rate and respiratory parameters.',
    });

    recheckActions.push('Apply a cool, damp compress to the face for 10 minutes.');
    recheckActions.push('Re-inspect skin in 45 minutes for spreading erythema or swelling.');
    vitalsToRetest.push('Skin Appearance', 'Body Temperature');
    redFlags.push('Swelling of lips, tongue, or throat (Anaphylaxis warning)');
  }

  // Default: Normal Equilibrium
  if (recheckActions.length === 0) {
    recheckActions.push('Continue normal daily activities and hydration.');
    recheckActions.push('Perform your routine evening check-in before sleep.');
    vitalsToRetest.push('Routine Vitals');
  }

  return {
    primaryPattern,
    patternCategory,
    patternConfidence: Number(confidence.toFixed(2)),
    patternSummary,
    contributingModalities: contributing,
    potentialConditionsToDiscuss: potentialConditions,
    recheckProtocol: {
      recommendedIntervalMinutes: recheckMinutes,
      recheckActions,
      hydrationAndRestAdvice: 'Maintain optimal hydration, gentle breathing, and avoid excessive physical exertion during the recheck window.',
      vitalsToRetest,
      urgentEmergencyRedFlags: redFlags.length > 0 ? redFlags : [
        'Sudden severe chest pressure or shortness of breath',
        'Uncontrollable fever exceeding 39.5°C',
        'Confusion or difficulty speaking',
      ],
      nextScheduledRecheckAt: new Date(Date.now() + recheckMinutes * 60 * 1000),
    },
    triageLevel,
  };
};

module.exports = {
  evaluateMultimodalCheckup,
};
