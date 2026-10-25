/**
 * VitaBridge AI - Simulation Engine (Demo Mode per Section 24)
 * Generates realistic synthetic physiological scenarios:
 * 1. NORMAL MODE
 * 2. UNUSUAL ACTIVITY MODE
 * 3. AUDIO EVENT MODE
 * 4. PHYSIOLOGICAL CHANGE MODE
 * 5. MULTIMODAL EVENT MODE
 * Clearly labels all generated data with DEMO DATA watermark.
 */

const { ingestReading } = require('./readingService');
const HealthBaseline = require('../models/HealthBaseline');
const HealthTrend = require('../models/HealthTrend');
const CameraObservation = require('../models/CameraObservation');
const AudioObservation = require('../models/AudioObservation');
const ActivityObservation = require('../models/ActivityObservation');
const { createAndBroadcastAlert } = require('./ai/alertService');
const { generateExplainableAiSummary } = require('./ai/explanationService');

const SCENARIOS = {
  NORMAL_MODE: {
    name: 'Normal Mode',
    description: 'All physiological, visual, acoustic, and activity signals remain near healthy baseline.',
    generator: (base) => ({
      heartRate: Math.round(base.heartRate.mean + (Math.random() * 4 - 2)),
      hrv: Math.round(base.hrv.mean + (Math.random() * 6 - 3)),
      spo2: Math.min(100, Math.round(base.spo2.mean + (Math.random() * 1 - 0.5))),
      temperature: Number((base.temperature.mean + (Math.random() * 0.2 - 0.1)).toFixed(1)),
      respiratoryRate: Math.round(base.respiratoryRate.mean + (Math.random() * 2 - 1)),
      bloodPressure: {
        systolic: Math.round(base.systolicBP.mean + (Math.random() * 6 - 3)),
        diastolic: Math.round(base.diastolicBP.mean + (Math.random() * 4 - 2)),
      },
      sleepHours: Number((base.sleepHours.mean + (Math.random() * 0.6 - 0.3)).toFixed(1)),
      sleepQuality: 88,
      activityLevel: 0.70,
      steps: 8450,
      calories: 2150,
      stressLevel: 0.22,
      symptoms: [],
      sourceType: 'simulated',
      context: { exerciseType: 'Daily Walk (30m)', notes: 'DEMO DATA — NOT REAL MEDICAL MEASUREMENTS. Normal baseline.' },
    }),
  },

  UNUSUAL_ACTIVITY_MODE: {
    name: 'Unusual Activity Mode',
    description: 'Activity suddenly drops from 8,200 to 2,800 steps with prolonged sedentary stretch.',
    generator: (base) => ({
      heartRate: Math.round(base.heartRate.mean + 4),
      hrv: Math.round(base.hrv.mean - 6),
      spo2: 98,
      temperature: Number(base.temperature.mean.toFixed(1)),
      respiratoryRate: base.respiratoryRate.mean,
      bloodPressure: {
        systolic: base.systolicBP.mean,
        diastolic: base.diastolicBP.mean,
      },
      sleepHours: Number(base.sleepHours.mean.toFixed(1)),
      sleepQuality: 75,
      activityLevel: 0.22,
      steps: 2800, // Significant drop vs baseline
      calories: 1550,
      stressLevel: 0.45,
      symptoms: [],
      sourceType: 'simulated',
      context: { exerciseType: 'None', notes: 'DEMO DATA — Unusual activity deficit detected.' },
    }),
  },

  AUDIO_EVENT_MODE: {
    name: 'Audio Event Mode',
    description: 'Simulates cluster of 8 cough-like acoustic events over 12 minutes (86% confidence).',
    generator: (base) => ({
      heartRate: Math.round(base.heartRate.mean + 8),
      hrv: Math.round(base.hrv.mean - 10),
      spo2: 96,
      temperature: Number((base.temperature.mean + 0.3).toFixed(1)),
      respiratoryRate: Math.round(base.respiratoryRate.mean + 3),
      bloodPressure: {
        systolic: base.systolicBP.mean + 4,
        diastolic: base.diastolicBP.mean + 2,
      },
      sleepHours: Number((base.sleepHours.mean - 0.8).toFixed(1)),
      sleepQuality: 68,
      activityLevel: 0.40,
      steps: 4500,
      calories: 1750,
      stressLevel: 0.52,
      symptoms: [{ name: 'Dry Cough & Throat Irritation', severity: 'mild' }],
      sourceType: 'simulated',
      context: { notes: 'DEMO DATA — Acoustic cough events observed during session.' },
    }),
  },

  PHYSIOLOGICAL_CHANGE_MODE: {
    name: 'Physiological Change Mode',
    description: 'Heart rate +18%, SpO2 dips to 94%, sleep down 25%, and low physical activity.',
    generator: (base) => ({
      heartRate: Math.round(base.heartRate.mean + 16),
      hrv: Math.max(15, Math.round(base.hrv.mean - 18)),
      spo2: 94, // Clinically notable dip
      temperature: Number((base.temperature.mean + 0.5).toFixed(1)),
      respiratoryRate: Math.round(base.respiratoryRate.mean + 4),
      bloodPressure: {
        systolic: base.systolicBP.mean + 10,
        diastolic: base.diastolicBP.mean + 6,
      },
      sleepHours: Number((base.sleepHours.mean - 1.8).toFixed(1)),
      sleepQuality: 56,
      activityLevel: 0.28,
      steps: 3200,
      calories: 1600,
      stressLevel: 0.68,
      symptoms: [{ name: 'Shortness of breath on mild exertion', severity: 'mild' }],
      sourceType: 'simulated',
      context: { notes: 'DEMO DATA — Multi-vital deviation from historical baseline.' },
    }),
  },

  MULTIMODAL_EVENT_MODE: {
    name: 'Multimodal Event Mode (Camera + Audio + Vitals + Activity)',
    description: 'Concurrently simulates flushed skin, eye fatigue, repeated coughs, tachycardia (+22% HR), and severe inactivity -> Triggers Orange/Red Recheck.',
    generator: (base) => ({
      heartRate: Math.round(base.heartRate.mean + 22),
      hrv: Math.max(12, Math.round(base.hrv.mean - 22)),
      spo2: 93,
      temperature: 38.2, // Febrile
      respiratoryRate: Math.round(base.respiratoryRate.mean + 6),
      bloodPressure: {
        systolic: base.systolicBP.mean + 14,
        diastolic: base.diastolicBP.mean + 8,
      },
      sleepHours: Number((base.sleepHours.mean - 2.5).toFixed(1)),
      sleepQuality: 42,
      activityLevel: 0.12,
      steps: 1800,
      calories: 1400,
      stressLevel: 0.88,
      symptoms: [
        { name: 'Chills & Body Aches', severity: 'moderate' },
        { name: 'Fatigue', severity: 'severe' },
      ],
      sourceType: 'simulated',
      context: { notes: 'DEMO DATA — NOT REAL MEDICAL MEASUREMENTS. Multimodal deviation.' },
    }),
  },
};

// Aliases for legacy compatibility
SCENARIOS.NORMAL_DAY = SCENARIOS.NORMAL_MODE;
SCENARIOS.RECOVERY_DAY = SCENARIOS.NORMAL_MODE;
SCENARIOS.STRESSFUL_DAY = SCENARIOS.PHYSIOLOGICAL_CHANGE_MODE;
SCENARIOS.ABNORMAL_TREND = SCENARIOS.AUDIO_EVENT_MODE;
SCENARIOS.PERSISTENT_DEVIATION = SCENARIOS.MULTIMODAL_EVENT_MODE;

const runSimulationScenario = async (userId, scenarioKey = 'NORMAL_MODE', user) => {
  const scenario = SCENARIOS[scenarioKey] || SCENARIOS.NORMAL_MODE;

  let baseline = await HealthBaseline.findOne({ userId });
  if (!baseline) {
    const { initializeBaselineForUser } = require('./readingService');
    baseline = await initializeBaselineForUser(userId, {});
  }

  const rawData = scenario.generator(baseline);
  rawData.userId = userId;
  rawData.timestamp = new Date();

  // Ingest reading through standard pipeline
  const result = await ingestReading(rawData, user);

  // If Unusual Activity Mode, create activity observation
  if (scenarioKey === 'UNUSUAL_ACTIVITY_MODE') {
    await ActivityObservation.create({
      userId,
      timestamp: new Date(),
      stepCountToday: 2800,
      baselineExpectedSteps: baseline.dailySteps?.mean || 8200,
      activityDeficitPercent: -65,
      inactivityDurationMinutes: 240,
      isUnusualActivityDetected: true,
      promptMessage: 'Your activity level is significantly lower than your usual pattern today.',
      isDemo: true,
    });
  }

  // If Audio Event Mode, create audio observation
  if (scenarioKey === 'AUDIO_EVENT_MODE' || scenarioKey === 'MULTIMODAL_EVENT_MODE') {
    await AudioObservation.create({
      userId,
      timestamp: new Date(),
      eventType: 'cough_like',
      confidence: 86,
      frequency: 8,
      durationSeconds: 720,
      isUnusualPatternDetected: true,
      interpretation: 'Repeated cough-like acoustic events detected (8 times, 86% confidence) during this 12-minute session.',
      isDemo: true,
    });
  }

  // If Multimodal Event Mode, create camera observation and trigger early warning
  if (scenarioKey === 'MULTIMODAL_EVENT_MODE') {
    await CameraObservation.create({
      userId,
      timestamp: new Date(),
      eyeOpennessPercent: 58,
      blinkRatePerMin: 26,
      facialAppearanceChanges: {
        skinFlushingIndex: 68,
        skinPallorIndex: -20,
        facialFatigueScore: 78,
        perceivedAlertness: 'moderate_exhaustion',
      },
      isUnusualPatternDetected: true,
      unusualPatternDetails: 'Visual analysis detected pronounced cutaneous flushing and marked ocular fatigue.',
      isDemo: true,
    });

    const explanation = generateExplainableAiSummary({
      tier: 'RED',
      affectedSignals: [
        { name: 'Resting Heart Rate', percentChange: 22 },
        { name: 'Core Temperature', percentChange: 5 },
        { name: 'Oxygen Saturation (SpO2)', percentChange: -5 },
        { name: 'Physical Steps', percentChange: -78 },
      ],
      audioInterpretation: 'Repeated cough-like acoustic events detected',
      activityDeficit: -78,
    });

    await createAndBroadcastAlert({
      userId,
      alertLevel: 'RED',
      title: 'Multimodal Sensor Deviation: Seek Professional Attention',
      summary: 'Concurrent deviations observed across camera photometrics, acoustic cough events, resting tachycardia, and acute physical inactivity.',
      earlyWarningScore: 82,
      physiologicalTrendScore: 35,
      recommendedNextAction: 'Your measurements show a significant change from your usual pattern. Please consider contacting a healthcare professional. If you are experiencing severe or emergency symptoms, seek urgent medical care.',
      explainableAi: explanation,
    });
  }

  return {
    scenarioName: scenario.name,
    scenarioDescription: scenario.description,
    isDemo: true,
    watermark: 'DEMO DATA — NOT REAL MEDICAL MEASUREMENTS',
    ...result,
  };
};

module.exports = {
  SCENARIOS,
  runSimulationScenario,
};
