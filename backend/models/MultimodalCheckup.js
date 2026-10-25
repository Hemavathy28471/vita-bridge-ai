const mongoose = require('mongoose');

const multimodalCheckupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    // Modality: Visual & Skin Photometry (Webcam)
    visualBiomarkers: {
      skinPallorIndex: { type: Number, default: 0 }, // -100 to +100 (negative = pale, positive = flushed)
      skinFlushingIndex: { type: Number, default: 0 }, // 0 to 100
      facialFatigueScore: { type: Number, default: 0 }, // 0 to 100
      eyeBlinkRatePerMin: { type: Number, default: 16 },
      perceivedAlertness: { type: String, enum: ['alert', 'mild_fatigue', 'moderate_exhaustion', 'acute_distress'], default: 'alert' },
      facialSymmetryScore: { type: Number, default: 96 }, // %
      rPPGEstimateBPM: { type: Number, default: null },
      scanQualityScore: { type: Number, default: 92 }, // %
    },
    // Modality: Vocal & Respiratory Acoustics (Microphone)
    vocalBiomarkers: {
      pitchJitterPercent: { type: Number, default: 0.8 }, // normal ~0.5 - 1.2%
      vocalTremorScore: { type: Number, default: 12 }, // 0 - 100
      speechRateWpm: { type: Number, default: 130 }, // words per minute
      voiceStrainScore: { type: Number, default: 15 }, // 0 - 100
      hoarsenessScore: { type: Number, default: 10 }, // 0 - 100
      pauseDurationRatio: { type: Number, default: 0.18 }, // ratio of speech silence
      acousticQualityScore: { type: Number, default: 90 },
    },
    // Modality: Clinical Health Questionnaire
    questionnaire: {
      primarySymptoms: [{ type: String }],
      durationDays: { type: Number, default: 1 },
      feverReported: { type: Boolean, default: false },
      breathingDifficulty: { type: String, enum: ['none', 'mild_on_exertion', 'moderate', 'severe_at_rest'], default: 'none' },
      painScore: { type: Number, min: 0, max: 10, default: 0 },
      appetiteStatus: { type: String, enum: ['normal', 'reduced', 'absent'], default: 'normal' },
      sleepQualityLastNight: { type: String, enum: ['restful', 'interrupted', 'severe_insomnia'], default: 'restful' },
      medicationsTakenRecently: [{ type: String }],
      userNotes: { type: String, default: '' },
    },
    // Concurrent physiological baseline comparison snapshot
    physiologicalSnapshot: {
      heartRate: Number,
      hrv: Number,
      spo2: Number,
      temperature: Number,
      systolicBP: Number,
      diastolicBP: Number,
    },
    // AI Multimodal Pattern Identification (Non-Diagnostic)
    patternAnalysis: {
      primaryPattern: {
        type: String,
        required: true,
      },
      patternCategory: {
        type: String,
        enum: [
          'viral_febrile_syndrome',
          'upper_respiratory_strain',
          'autonomic_exhaustion',
          'dermatological_thermal_stress',
          'normal_equilibrium',
          'unspecified_physiological_shift',
        ],
        default: 'normal_equilibrium',
      },
      patternConfidence: {
        type: Number,
        default: 0.88,
      },
      patternSummary: String,
      contributingModalities: [
        {
          modality: String,
          observation: String,
          impactWeight: Number,
        },
      ],
    },
    // Differential possibilities to discuss with a clinician
    potentialConditionsToDiscuss: [
      {
        categoryName: String,
        description: String,
        likelihoodTier: { type: String, enum: ['possible', 'moderate_correlation', 'consider_evaluating'] },
        rationale: String,
      },
    ],
    // Structured Recheck Protocol ("Rechk")
    recheckProtocol: {
      recommendedIntervalMinutes: { type: Number, default: 60 },
      recheckActions: [{ type: String }],
      hydrationAndRestAdvice: String,
      vitalsToRetest: [{ type: String }],
      urgentEmergencyRedFlags: [{ type: String }],
      nextScheduledRecheckAt: Date,
    },
    triageLevel: {
      type: String,
      enum: ['ROUTINE', 'MONITOR_CLOSELY', 'URGENT_EVALUATION'],
      default: 'ROUTINE',
      index: true,
    },
    alertGeneratedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
    },
  },
  {
    timestamps: true,
  }
);

multimodalCheckupSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model('MultimodalCheckup', multimodalCheckupSchema);
