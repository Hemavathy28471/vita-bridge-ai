const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    alertLevel: {
      type: String,
      enum: ['GREEN', 'YELLOW', 'ORANGE', 'RED'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    earlyWarningScore: {
      type: Number, // 0 - 100
      required: true,
    },
    physiologicalTrendScore: {
      type: Number, // 0 - 100
      required: true,
    },
    confidence: {
      type: Number, // 0.0 - 1.0
      default: 0.9,
    },
    affectedSignals: [
      {
        signal: String,
        currentValue: Number,
        baselineValue: Number,
        percentChange: Number,
        unit: String,
        zScore: Number,
      },
    ],
    baselineComparisonText: String,
    recommendedNextAction: {
      type: String,
      required: true,
    },
    disclaimer: {
      type: String,
      default: 'VitaBridge AI is a health screening and early-warning/decision-support platform, not a diagnostic system. Never present an AI prediction as a confirmed diagnosis.',
    },
    // Explainable AI block per Section 13: "Why am I seeing this?"
    explainableAi: {
      why: String, // "Your recent data differs from your personal baseline: Resting heart rate: +16%, Sleep: -24%..."
      whatDoesThisMean: String, // "These signals represent a change from your usual pattern. They do not establish a diagnosis."
      whatShouldIDo: String, // "Perform a recheck and monitor how you feel. Seek professional advice if symptoms persist or worsen."
      contributingFactors: [
        {
          factor: String,
          weightPercent: Number,
          observation: String,
        },
      ],
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'resolved', 'dismissed'],
      default: 'active',
      index: true,
    },
    acknowledgedAt: Date,
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    eventType: {
      type: String,
      default: 'early_warning_alert',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Section 20 indexes
alertSchema.index({ userId: 1, alertLevel: 1, createdAt: -1 });
alertSchema.index({ userId: 1, timestamp: -1 });
alertSchema.index({ eventType: 1, alertLevel: 1 });

module.exports = mongoose.model('Alert', alertSchema);
