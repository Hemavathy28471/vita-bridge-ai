const mongoose = require('mongoose');

const physiologicalReadingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      default: 'sim-device-01',
      index: true,
    },
    sourceType: {
      type: String,
      enum: ['smartwatch', 'fitness_band', 'smartphone', 'bluetooth_device', 'manual_input', 'csv_import', 'simulated'],
      default: 'simulated',
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    eventType: {
      type: String,
      default: 'physiological_reading',
      index: true,
    },
    // Modality 1: Cardiovascular
    heartRate: {
      type: Number,
      min: 30,
      max: 240,
    },
    hrv: {
      type: Number, // RMSSD in ms
      min: 5,
      max: 200,
    },
    // Modality 2: Oxygenation
    spo2: {
      type: Number, // %
      min: 70,
      max: 100,
    },
    // Modality 3: Temperature
    temperature: {
      type: Number, // Celsius
      min: 34.0,
      max: 42.5,
    },
    // Modality 4: Respiratory
    respiratoryRate: {
      type: Number, // Breaths per minute
      min: 6,
      max: 60,
    },
    // Modality 5: Blood Pressure
    bloodPressure: {
      systolic: { type: Number, min: 60, max: 250 },
      diastolic: { type: Number, min: 40, max: 150 },
    },
    // Modality: Weight
    weight: {
      type: Number, // kg
      min: 20,
      max: 350,
    },
    // Modality 6: Sleep & Rest
    sleepHours: {
      type: Number,
      min: 0,
      max: 24,
    },
    sleepQuality: {
      type: Number, // 0 - 100
      min: 0,
      max: 100,
    },
    // Modality 7: Activity, Movement & Stress Context
    activityLevel: {
      type: Number, // 0.0 to 1.0 normalized
      min: 0,
      max: 1,
    },
    steps: {
      type: Number,
      min: 0,
    },
    calories: {
      type: Number,
      min: 0,
    },
    stressLevel: {
      type: Number, // 0.0 to 1.0 normalized
      min: 0,
      max: 1,
    },
    // User-Reported Symptoms & Context
    symptoms: [
      {
        name: { type: String, trim: true },
        severity: { type: String, enum: ['mild', 'moderate', 'severe'], default: 'mild' },
        onset: { type: Date, default: Date.now },
      },
    ],
    context: {
      exerciseType: String,
      exerciseDurationMinutes: Number,
      caffeineIntake: Boolean,
      notes: String,
    },
    // Pipeline processing flags
    isValidated: {
      type: Boolean,
      default: true,
    },
    isCleaned: {
      type: Boolean,
      default: true,
    },
    noiseFlags: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for time-series queries
physiologicalReadingSchema.index({ userId: 1, timestamp: -1 });
physiologicalReadingSchema.index({ userId: 1, deviceId: 1, timestamp: -1 });
physiologicalReadingSchema.index({ eventType: 1, timestamp: -1 });

module.exports = mongoose.model('PhysiologicalReading', physiologicalReadingSchema);
