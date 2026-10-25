const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['smartwatch', 'fitness_band', 'bp_monitor', 'pulse_oximeter', 'thermometer', 'smart_scale', 'manual_source'],
      required: true,
    },
    model: String,
    manufacturer: String,
    status: {
      type: String,
      enum: ['connected', 'disconnected', 'syncing', 'error'],
      default: 'connected',
    },
    batteryLevel: {
      type: Number,
      min: 0,
      max: 100,
      default: 88,
    },
    lastSync: {
      type: Date,
      default: Date.now,
    },
    supportedModalities: [
      {
        type: String,
      },
    ],
    firmwareVersion: {
      type: String,
      default: 'v2.4.1',
    },
    isSimulated: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

deviceSchema.index({ userId: 1, deviceId: 1 });

module.exports = mongoose.model('Device', deviceSchema);
