const User = require('../models/User');
const Profile = require('../models/Profile');
const jwt = require('jsonwebtoken');
const { logAuditEvent } = require('../middleware/audit');
const { initializeBaselineForUser } = require('../services/readingService');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'vitabridge_default_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// Register new user
const register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', age, gender, heightCm, weightKg } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: ['patient', 'caregiver', 'admin'].includes(role) ? role : 'patient',
    });

    const profile = await Profile.create({
      userId: user._id,
      age: age || 34,
      gender: gender || 'female',
      heightCm: heightCm || 168,
      weightKg: weightKg || 64,
    });

    // Initialize default baseline for patient
    if (user.role === 'patient') {
      await initializeBaselineForUser(user._id, {});
    }

    const token = generateToken(user._id);

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_REGISTER',
      resourceType: 'USER',
      req,
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const profile = await Profile.findOne({ userId: user._id });
    const token = generateToken(user._id);

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'AUTH_LOGIN',
      resourceType: 'USER',
      req,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Quick demo login persona switcher
const demoLogin = async (req, res) => {
  try {
    const { persona = 'patient' } = req.body; // 'patient', 'caregiver', 'admin'
    let query = { role: persona };

    let user = await User.findOne(query);
    if (!user) {
      // Fallback to any user with that role or first user
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'No demo accounts seeded yet.' });
    }

    const profile = await Profile.findOne({ userId: user._id });
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get current profile
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const profile = await Profile.findOne({ userId: req.user._id });

    res.json({
      success: true,
      user,
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update profile & preferences
const updateProfile = async (req, res) => {
  try {
    const { name, preferences, profileData } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (preferences) user.preferences = { ...user.preferences, ...preferences };
    await user.save();

    let profile = await Profile.findOne({ userId: req.user._id });
    if (profileData && profile) {
      Object.assign(profile, profileData);
      await profile.save();
    }

    await logAuditEvent({
      actorId: user._id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'PROFILE_UPDATED',
      resourceType: 'PROFILE',
      req,
    });

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      },
      profile,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  register,
  login,
  demoLogin,
  getMe,
  updateProfile,
};
