const mongoose = require('mongoose');

const metricBaselineSchema = new mongoose.Schema(
  {
    mean: { type: Number, required: true },
    median: { type: Number, required: true },
    stdDev: { type: Number, required: true },
    min: { type: Number },
    max: { type: Number },
    p10: { type: Number },
    p25: { type: Number },
    p75: { type: Number },
    p90: { type: Number },
    movingAverage7d: { type: Number },
    movingStdDev7d: { type: Number },
    percentChange: { type: Number, default: 0 },
    trendDirection: { type: String, enum: ['stable', 'increasing', 'decreasing', 'fluctuating'], default: 'stable' },
    personalPercentile: { type: Number, default: 50 },
    sampleCount: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

const healthBaselineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['calibrating', 'active', 'recalibrating'],
      default: 'active',
    },
    calibrationProgressPercent: {
      type: Number,
      default: 100,
    },
    // Physiological Modality Baselines
    heartRate: metricBaselineSchema,
    hrv: metricBaselineSchema,
    spo2: metricBaselineSchema,
    temperature: metricBaselineSchema,
    respiratoryRate: metricBaselineSchema,
    systolicBP: metricBaselineSchema,
    diastolicBP: metricBaselineSchema,
    sleepHours: metricBaselineSchema,
    sleepQuality: metricBaselineSchema,
    activityLevel: metricBaselineSchema,
    stressLevel: metricBaselineSchema,
    // Behavioral & Activity Modality Baselines
    dailySteps: metricBaselineSchema,
    inactivityMinutes: metricBaselineSchema,
    // Visual & Acoustic Modality Baselines
    blinkRate: metricBaselineSchema,
    coughFrequency: metricBaselineSchema,
    speechRate: metricBaselineSchema,
    // Contextual baseline parameters
    baselineWindows: {
      dailyDays: { type: Number, default: 1 },
      weeklyDays: { type: Number, default: 7 },
      monthlyDays: { type: Number, default: 30 },
    },
    adaptationRate: {
      type: Number,
      default: 0.05, // Exponential moving adaptation factor
    },
    lastRecalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('HealthBaseline', healthBaselineSchema);
