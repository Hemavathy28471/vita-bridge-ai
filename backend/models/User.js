const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['patient', 'caregiver', 'admin'],
      default: 'patient',
    },
    isDemoUser: {
      type: Boolean,
      default: false,
    },
    demoPersona: {
      type: String,
      default: null, // e.g. 'sarah_jenkins', 'michael_chen', 'dr_eleanor'
    },
    preferences: {
      alertSensitivity: {
        type: String,
        enum: ['low', 'normal', 'high'],
        default: 'normal',
      },
      quietHours: {
        enabled: { type: Boolean, default: false },
        start: { type: String, default: '22:00' },
        end: { type: String, default: '07:00' },
      },
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        caregiverNotify: { type: Boolean, default: true },
      },
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
