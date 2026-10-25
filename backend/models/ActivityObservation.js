const mongoose = require('mongoose');

const activityObservationSchema = new mongoose.Schema(
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
      default: 'device_wearable_default',
      index: true,
    },
    eventType: {
      type: String,
      default: 'activity_telemetry',
      index: true,
    },
    currentPosture: {
      type: String,
      enum: ['standing', 'sitting', 'walking', 'running', 'lying_down', 'unusual'],
      default: 'sitting',
    },
    stepCountToday: {
      type: Number,
      default: 3400,
    },
    baselineExpectedSteps: {
      type: Number,
      default: 8200,
    },
    activityDeficitPercent: {
      type: Number, // e.g. -58%
      default: 0,
    },
    inactivityDurationMinutes: {
      type: Number,
      default: 120,
    },
    movementIntensity: {
      type: Number, // 0 - 100
      default: 25,
    },
    isNighttimeActivity: {
      type: Boolean,
      default: false,
    },
    // Unusual Activity Engine Context
    isUnusualActivityDetected: {
      type: Boolean,
      default: false,
    },
    promptMessage: {
      type: String,
      default: null, // "You have been significantly less active than your usual pattern today."
    },
    userContextResponse: {
      type: String,
      enum: ['resting', 'unwell', 'different_schedule', 'recheck', null],
      default: null,
    },
    contextProvidedAt: Date,
    isPersistentAbnormality: {
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
activityObservationSchema.index({ userId: 1, timestamp: -1 });
activityObservationSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });
activityObservationSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('ActivityObservation', activityObservationSchema);
