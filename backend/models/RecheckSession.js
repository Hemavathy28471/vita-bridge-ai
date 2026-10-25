const mongoose = require('mongoose');

const recheckSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    protocolType: {
      type: String,
      enum: ['general', 'fatigue', 'respiratory', 'activity', 'stress_recovery'],
      required: true,
      default: 'general',
    },
    triggerSource: {
      type: String,
      enum: ['camera_deviation', 'cough_cluster', 'activity_drop', 'manual', 'unusual_pattern'],
      default: 'manual',
    },
    status: {
      type: String,
      enum: ['initiated', 'in_progress', 'completed', 'cancelled'],
      default: 'completed',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    durationSeconds: {
      type: Number,
      default: 30,
    },
    initialSignals: {
      heartRate: Number,
      spo2: Number,
      temperature: Number,
      respiratoryRate: Number,
      skinFlushingIndex: Number,
      blinkRatePerMin: Number,
      coughEventCount: Number,
      speechRateWpm: Number,
      activityLevel: String,
    },
    recheckSignals: {
      heartRate: Number,
      hrv: Number,
      spo2: Number,
      temperature: Number,
      respiratoryRate: Number,
      skinFlushingIndex: Number,
      blinkRatePerMin: Number,
      eyeOpennessPercent: Number,
      coughEventCount: Number,
      voiceQualityScore: Number,
      breathingAcousticsScore: Number,
      movementStability: Number,
      rppgPulseBpm: Number,
    },
    userSymptomInput: {
      reportedFatigue: { type: Number, default: 2 }, // 0 - 5
      reportedPain: { type: Number, default: 0 },    // 0 - 10
      reportedDyspnea: { type: Boolean, default: false },
      reportedFeverFeeling: { type: Boolean, default: false },
      notes: { type: String, default: '' },
    },
    comparisonResult: {
      persists: { type: Boolean, default: false },
      deltaPercentFromInitial: { type: Number, default: 0 },
      deltaPercentFromBaseline: { type: Number, default: 0 },
      consistencyScore: { type: Number, default: 85 }, // 0 - 100
      interpretation: { type: String, default: '' },
    },
    multimodalFusionOutcome: {
      earlyWarningScore: { type: Number, default: 20 },
      physiologicalTrendScore: { type: Number, default: 85 },
      assignedAlertTier: {
        type: String,
        enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
        default: 'GREEN',
        index: true,
      },
      confidence: { type: Number, default: 0.88 },
      explainableSummary: {
        why: String,
        whatDoesThisMean: String,
        whatShouldIDo: String,
      },
      recommendedNextAction: String,
    },
    isDemo: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes per Section 20
recheckSessionSchema.index({ userId: 1, startedAt: -1 });
recheckSessionSchema.index({ assignedAlertTier: 1, startedAt: -1 });

module.exports = mongoose.model('RecheckSession', recheckSessionSchema);
