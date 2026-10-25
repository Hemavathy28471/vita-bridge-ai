const mongoose = require('mongoose');

const cameraObservationSchema = new mongoose.Schema(
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
      default: 'device_camera_default',
      index: true,
    },
    eventType: {
      type: String,
      default: 'visual_observation',
      index: true,
    },
    // Facial Landmark & Eye Dynamics
    facialLandmarksDetected: {
      type: Boolean,
      default: true,
    },
    eyeOpennessPercent: {
      type: Number, // 0 - 100
      default: 85,
    },
    blinkRatePerMin: {
      type: Number,
      default: 16,
    },
    headPose: {
      pitch: { type: Number, default: 0 },
      yaw: { type: Number, default: 0 },
      roll: { type: Number, default: 0 },
    },
    // Visual Appearance Patterns
    facialAppearanceChanges: {
      skinFlushingIndex: { type: Number, default: 12 },
      skinPallorIndex: { type: Number, default: 0 },
      facialFatigueScore: { type: Number, default: 15 },
      perceivedAlertness: {
        type: String,
        enum: ['alert', 'mild_fatigue', 'moderate_exhaustion', 'drowsy'],
        default: 'alert',
      },
    },
    // Body & Posture
    bodyPosture: {
      postureType: {
        type: String,
        enum: ['standing', 'sitting', 'walking', 'running', 'lying_down', 'unusual'],
        default: 'sitting',
      },
      postureStabilityScore: { type: Number, default: 92 },
      movementIntensity: { type: Number, default: 18 }, // 0 - 100
      inactivitySeconds: { type: Number, default: 0 },
    },
    // Camera-based rPPG Physiological Estimation
    rppgPhysiological: {
      estimatedPulseBpm: { type: Number, default: null },
      pulseConfidence: { type: Number, default: 0.85 }, // 0.0 - 1.0
      signalQualityScore: { type: Number, default: 90 }, // 0 - 100
      waveformSample: [{ type: Number }], // short buffer of green-channel values
    },
    isUnusualPatternDetected: {
      type: Boolean,
      default: false,
    },
    unusualPatternDetails: {
      type: String,
      default: null,
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
cameraObservationSchema.index({ userId: 1, timestamp: -1 });
cameraObservationSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });
cameraObservationSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('CameraObservation', cameraObservationSchema);
