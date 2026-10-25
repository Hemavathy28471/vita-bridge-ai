const mongoose = require('mongoose');

const audioObservationSchema = new mongoose.Schema(
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
    deviceId: {
      type: String,
      default: 'device_microphone_default',
      index: true,
    },
    eventType: {
      type: String,
      enum: ['speech', 'silence', 'cough_like', 'throat_clearing', 'breathing_pattern', 'other'],
      default: 'speech',
      index: true,
    },
    confidence: {
      type: Number, // 0 - 100 percentage
      required: true,
      default: 85,
    },
    frequency: {
      type: Number, // count of events in current monitoring session
      default: 1,
    },
    durationSeconds: {
      type: Number, // duration in seconds
      default: 1.2,
    },
    // Vocal characteristics & acoustic parameters
    vocalAcoustics: {
      speechRateWpm: { type: Number, default: 135 },
      pauseDurationRatio: { type: Number, default: 0.18 }, // pauses / total duration
      pitchMeanHz: { type: Number, default: 180 },
      voiceEnergyRmsDb: { type: Number, default: -24 },
      pitchJitterPercent: { type: Number, default: 0.8 },
      voiceStrainScore: { type: Number, default: 15 }, // 0 - 100
      hoarsenessScore: { type: Number, default: 10 },  // 0 - 100
    },
    breathingAcoustics: {
      breathingCadencePerMin: { type: Number, default: 16 },
      irregularCadenceDetected: { type: Boolean, default: false },
      shallowBreathingScore: { type: Number, default: 10 },
    },
    interpretation: {
      type: String,
      default: null, // e.g., "Repeated cough-like acoustic events detected"
    },
    isUnusualPatternDetected: {
      type: Boolean,
      default: false,
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
audioObservationSchema.index({ userId: 1, timestamp: -1 });
audioObservationSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });
audioObservationSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('AudioObservation', audioObservationSchema);
