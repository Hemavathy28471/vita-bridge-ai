const mongoose = require('mongoose');

const healthTrendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['cardiovascular', 'respiratory', 'sleep', 'recovery', 'activity', 'stress', 'multimodal'],
      required: true,
    },
    patternType: {
      type: String,
      enum: ['sudden_shift', 'gradual_drift', 'persistent_abnormality', 'multi_signal_discordance', 'stable_baseline', 'cyclical_pattern'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    confidenceScore: {
      type: Number, // 0.0 to 1.0
      default: 0.85,
    },
    signalsInvolved: [
      {
        signalName: String,
        currentValue: Number,
        baselineValue: Number,
        percentChange: Number,
        direction: { type: String, enum: ['increasing', 'decreasing', 'fluctuating', 'stable'] },
      },
    ],
    durationDays: {
      type: Number,
      default: 1,
    },
    timeframe: {
      type: String,
      enum: ['24h', '7d', '30d', '90d'],
      default: '7d',
    },
    isCurrent: {
      type: Boolean,
      default: true,
    },
    severity: {
      type: String,
      enum: ['normal', 'mild', 'moderate', 'significant'],
      default: 'normal',
    },
  },
  {
    timestamps: true,
  }
);

healthTrendSchema.index({ userId: 1, isCurrent: 1, createdAt: -1 });

module.exports = mongoose.model('HealthTrend', healthTrendSchema);
