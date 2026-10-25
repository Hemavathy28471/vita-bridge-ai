const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    age: { type: Number, default: 34 },
    gender: { type: String, enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'], default: 'female' },
    heightCm: { type: Number, default: 168 },
    weightKg: { type: Number, default: 64 },
    bloodType: { type: String, default: 'A+' },
    chronicConditions: [{ type: String }],
    medications: [
      {
        name: String,
        dosage: String,
        frequency: String,
        startDate: Date,
      },
    ],
    emergencyContact: {
      name: String,
      relation: String,
      phone: String,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Profile', profileSchema);
