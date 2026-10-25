/**
 * VitaBridge AI - Database Seeder
 * Populates realistic multimodal physiological data, baseline signatures,
 * demo personas, caregiver relationships, and active alerts.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Profile = require('../models/Profile');
const Device = require('../models/Device');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const HealthBaseline = require('../models/HealthBaseline');
const HealthTrend = require('../models/HealthTrend');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Consent = require('../models/Consent');
const CaregiverRelationship = require('../models/CaregiverRelationship');
const AuditLog = require('../models/AuditLog');
const { buildMetricBaseline } = require('../ai/baselineEngine');
const { connectDB, disconnectDB } = require('../config/db');

const seedAll = async () => {
  try {
    console.log('[Seed] Starting VitaBridge AI database seeding...');

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Profile.deleteMany({}),
      Device.deleteMany({}),
      PhysiologicalReading.deleteMany({}),
      HealthBaseline.deleteMany({}),
      HealthTrend.deleteMany({}),
      Alert.deleteMany({}),
      Notification.deleteMany({}),
      Consent.deleteMany({}),
      CaregiverRelationship.deleteMany({}),
      AuditLog.deleteMany({}),
    ]);

    // 1. Create Demo Personas
    const patientUser = await User.create({
      name: 'Sarah Jenkins',
      email: 'patient@vitabridge.ai',
      password: 'password123',
      role: 'patient',
      isDemoUser: true,
      demoPersona: 'sarah_jenkins',
      preferences: {
        alertSensitivity: 'normal',
        quietHours: { enabled: true, start: '22:30', end: '07:00' },
        channels: { inApp: true, email: true, caregiverNotify: true },
      },
    });

    const caregiverUser = await User.create({
      name: 'Michael Chen',
      email: 'caregiver@vitabridge.ai',
      password: 'password123',
      role: 'caregiver',
      isDemoUser: true,
      demoPersona: 'michael_chen',
    });

    const adminUser = await User.create({
      name: 'Dr. Eleanor Vance, MD',
      email: 'admin@vitabridge.ai',
      password: 'password123',
      role: 'admin',
      isDemoUser: true,
      demoPersona: 'dr_eleanor',
    });

    // 2. Profiles
    await Profile.create({
      userId: patientUser._id,
      age: 38,
      gender: 'female',
      heightCm: 168,
      weightKg: 63,
      bloodType: 'O+',
      chronicConditions: ['Mild Asthma (Well-controlled)'],
      medications: [{ name: 'Albuterol Inhaler', dosage: '90mcg', frequency: 'As needed', startDate: new Date('2024-01-15') }],
      emergencyContact: { name: 'Michael Chen', relation: 'Spouse', phone: '+1 (555) 234-8765' },
      notes: 'Monitors cardiovascular fitness and daily recovery trends.',
    });

    await Profile.create({
      userId: caregiverUser._id,
      age: 40,
      gender: 'male',
      heightCm: 180,
      weightKg: 78,
    });

    await Profile.create({
      userId: adminUser._id,
      age: 49,
      gender: 'female',
      heightCm: 172,
      weightKg: 66,
    });

    // 3. Caregiver Relationship & Consent
    await Consent.create({
      patientId: patientUser._id,
      authorizedPartyId: caregiverUser._id,
      authorizedPartyRole: 'caregiver',
      status: 'active',
      scopes: {
        viewPhysiologicalData: true,
        viewAlerts: true,
        viewTrends: true,
        receiveEmergencyNotifications: true,
        exportHealthReports: true,
      },
      grantedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    });

    await CaregiverRelationship.create({
      caregiverId: caregiverUser._id,
      patientId: patientUser._id,
      relationshipType: 'spouse',
      isPrimary: true,
      status: 'active',
      notificationRules: {
        notifyOnYellowAlerts: true,
        notifyOnRedAlerts: true,
        dailyDigest: true,
      },
    });

    // 4. Connected Devices for Sarah
    await Device.insertMany([
      {
        userId: patientUser._id,
        deviceId: 'apple-watch-s9-001',
        name: 'Apple Watch Series 9',
        type: 'smartwatch',
        manufacturer: 'Apple',
        status: 'connected',
        batteryLevel: 86,
        supportedModalities: ['Heart Rate', 'HRV', 'SpO2', 'Wrist Temp', 'Sleep', 'Activity'],
        isSimulated: true,
      },
      {
        userId: patientUser._id,
        deviceId: 'whoop-band-4-002',
        name: 'Whoop 4.0 Strap',
        type: 'fitness_band',
        manufacturer: 'Whoop',
        status: 'connected',
        batteryLevel: 72,
        supportedModalities: ['Resting HR', 'HRV RMSSD', 'Recovery Score', 'Sleep Stages'],
        isSimulated: true,
      },
      {
        userId: patientUser._id,
        deviceId: 'omron-bp-003',
        name: 'Omron Evolv Smart BP Cuff',
        type: 'bp_monitor',
        manufacturer: 'Omron',
        status: 'connected',
        batteryLevel: 94,
        supportedModalities: ['Systolic Blood Pressure', 'Diastolic Blood Pressure'],
        isSimulated: true,
      },
      {
        userId: patientUser._id,
        deviceId: 'withings-ox-004',
        name: 'Withings Pulse Ox',
        type: 'pulse_oximeter',
        manufacturer: 'Withings',
        status: 'disconnected',
        batteryLevel: 45,
        supportedModalities: ['Blood Oxygen SpO2'],
        isSimulated: true,
      },
    ]);

    // 5. Generate 30 Days of Realistic Multimodal Time-Series Data
    const readings = [];
    const baseHr = 71;
    const baseHrv = 46;
    const baseSpo2 = 98;
    const baseTemp = 36.6;
    const baseResp = 15;
    const baseSys = 118;
    const baseDia = 76;
    const baseSleep = 7.4;
    const baseSteps = 8200;

    const now = new Date();
    for (let day = 29; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);

      // Add gradual drift over the last 3 days to illustrate trend pattern
      let hrOffset = 0;
      let sleepOffset = 0;
      let tempOffset = 0;
      let hrvOffset = 0;

      if (day === 2) {
        hrOffset = 4;
        sleepOffset = -0.8;
        hrvOffset = -6;
      } else if (day === 1) {
        hrOffset = 8;
        sleepOffset = -1.4;
        hrvOffset = -12;
      } else if (day === 0) {
        // Today
        hrOffset = 11;
        sleepOffset = -1.9;
        tempOffset = 0.4;
        hrvOffset = -16;
      }

      const hr = Math.round(baseHr + hrOffset + (Math.random() * 4 - 2));
      const hrv = Math.max(15, Math.round(baseHrv + hrvOffset + (Math.random() * 6 - 3)));
      const spo2 = Math.min(100, Math.round(baseSpo2 + (Math.random() * 1.5 - 0.75)));
      const temp = Number((baseTemp + tempOffset + (Math.random() * 0.2 - 0.1)).toFixed(1));
      const resp = Math.round(baseResp + (Math.random() * 2 - 1));
      const sys = Math.round(baseSys + (Math.random() * 6 - 3));
      const dia = Math.round(baseDia + (Math.random() * 4 - 2));
      const sleep = Number(Math.max(4, baseSleep + sleepOffset + (Math.random() * 0.4 - 0.2)).toFixed(1));
      const steps = Math.max(2000, Math.round(baseSteps + (day <= 1 ? -2500 : Math.random() * 1500 - 750)));
      const activityLevel = Number((steps / 10000).toFixed(2));
      const stressLevel = Number((day <= 1 ? 0.68 : 0.25 + Math.random() * 0.15).toFixed(2));

      readings.push({
        userId: patientUser._id,
        deviceId: 'apple-watch-s9-001',
        sourceType: 'smartwatch',
        timestamp: date,
        heartRate: hr,
        hrv,
        spo2,
        temperature: temp,
        respiratoryRate: resp,
        bloodPressure: { systolic: sys, diastolic: dia },
        sleepHours: sleep,
        sleepQuality: Math.round(sleep * 11),
        activityLevel,
        steps,
        calories: Math.round(1800 + steps * 0.04),
        stressLevel,
        symptoms: day === 0 ? [{ name: 'Mild Fatigue', severity: 'mild' }] : [],
        context: { exerciseType: day > 2 ? 'Jogging 35m' : 'None', notes: day <= 1 ? 'High work strain' : 'Normal routine' },
        isValidated: true,
        isCleaned: true,
      });
    }

    await PhysiologicalReading.insertMany(readings);

    // 6. Compute Personalized Baseline for Sarah
    const hrVals = readings.map((r) => r.heartRate);
    const hrvVals = readings.map((r) => r.hrv);
    const spo2Vals = readings.map((r) => r.spo2);
    const tempVals = readings.map((r) => r.temperature);
    const respVals = readings.map((r) => r.respiratoryRate);
    const sysVals = readings.map((r) => r.bloodPressure.systolic);
    const diaVals = readings.map((r) => r.bloodPressure.diastolic);
    const sleepVals = readings.map((r) => r.sleepHours);
    const actVals = readings.map((r) => r.activityLevel);
    const stressVals = readings.map((r) => r.stressLevel);

    await HealthBaseline.create({
      userId: patientUser._id,
      status: 'active',
      calibrationProgressPercent: 100,
      heartRate: buildMetricBaseline(hrVals),
      hrv: buildMetricBaseline(hrvVals),
      spo2: buildMetricBaseline(spo2Vals),
      temperature: buildMetricBaseline(tempVals),
      respiratoryRate: buildMetricBaseline(respVals),
      systolicBP: buildMetricBaseline(sysVals),
      diastolicBP: buildMetricBaseline(diaVals),
      sleepHours: buildMetricBaseline(sleepVals),
      activityLevel: buildMetricBaseline(actVals),
      stressLevel: buildMetricBaseline(stressVals),
      baselineWindows: { dailyDays: 1, weeklyDays: 7, monthlyDays: 30 },
      adaptationRate: 0.05,
    });

    // 7. Seed Active Health Trend Pattern
    await HealthTrend.create({
      userId: patientUser._id,
      category: 'recovery',
      patternType: 'multi_signal_discordance',
      title: 'Sleep Deficit Coupled with Cardiovascular Elevation',
      description: 'Over the past 3 days, average sleep duration dropped by 24% while resting heart rate shifted upward by +14% compared to baseline.',
      confidenceScore: 0.91,
      signalsInvolved: [
        { signalName: 'Sleep Duration', currentValue: 5.5, baselineValue: 7.4, percentChange: -25.7, direction: 'decreasing' },
        { signalName: 'Heart Rate', currentValue: 82, baselineValue: 71, percentChange: 15.5, direction: 'increasing' },
        { signalName: 'HRV', currentValue: 30, baselineValue: 46, percentChange: -34.8, direction: 'decreasing' },
      ],
      durationDays: 3,
      timeframe: '7d',
      severity: 'moderate',
      isCurrent: true,
    });

    // 8. Seed Active Alert (YELLOW ALERT)
    const alert = await Alert.create({
      userId: patientUser._id,
      alertLevel: 'YELLOW',
      title: 'Monitoring: Mild variation from your personal baseline',
      summary: 'Resting heart rate has remained elevated (+15.5% above baseline) concurrent with a 3-day sleep reduction.',
      earlyWarningScore: 54,
      physiologicalTrendScore: 68,
      confidence: 0.92,
      affectedSignals: [
        { signal: 'Resting Heart Rate', currentValue: 82, baselineValue: 71, percentChange: 15.5, unit: 'BPM', zScore: 2.3 },
        { signal: 'Sleep Duration', currentValue: 5.5, baselineValue: 7.4, percentChange: -25.7, unit: 'hours', zScore: -2.1 },
        { signal: 'HRV RMSSD', currentValue: 30, baselineValue: 46, percentChange: -34.8, unit: 'ms', zScore: -1.9 },
      ],
      baselineComparisonText: 'Heart Rate: +15.5% (82 vs 71 BPM); Sleep: -25.7% (5.5h vs 7.4h)',
      recommendedNextAction: 'Prioritize restful sleep and gentle hydration. Avoid intense workouts tonight. If palpitations or breathlessness occur, consult a physician.',
      explainableAi: {
        whatHappened: 'A noticeable variation from your standard baseline was observed across Resting Heart Rate and Sleep Duration.',
        whyDetected: 'Multiple biometrics diverged simultaneously, indicating heightened physiological workload or acute stress.',
        howDifferentFromBaseline: 'Heart rate is 11 BPM above your personal average; sleep is 1.9 hours shorter than normal.',
        contributingFactors: [
          { factor: 'Resting Heart Rate', weightPercent: 40, observation: '15.5% above baseline (82 vs 71 BPM)' },
          { factor: 'Heart Rate Variability', weightPercent: 30, observation: 'Suppressed HRV (30 ms vs 46 ms normal)' },
          { factor: 'Sleep Duration', weightPercent: 30, observation: '5.5 hours recorded (normal requirement is 7.4 hours)' },
        ],
        practicalGuidance: 'Consider taking a break to rest, drinking plenty of water, and checking measurements again later. If symptoms persist or you feel unwell, consult your doctor.',
      },
      status: 'active',
    });

    // 9. In-App Notification
    await Notification.create({
      userId: patientUser._id,
      alertId: alert._id,
      title: 'Yellow Alert: Physiological Variation Detected',
      message: alert.summary,
      type: 'alert',
      severity: 'warning',
      isRead: false,
      channels: [
        { channel: 'inApp', delivered: true },
        { channel: 'email', delivered: true },
      ],
    });

    // 10. Audit Log
    await AuditLog.create({
      actorId: adminUser._id,
      actorEmail: adminUser.email,
      actorRole: adminUser.role,
      action: 'DATA_INGESTION',
      resourceType: 'SYSTEM',
      status: 'SUCCESS',
      details: { message: 'Demo seed data initialized successfully' },
    });

    console.log('[Seed] Database successfully seeded with demo personas, 30-day baseline, and alerts!');
  } catch (err) {
    console.error('[Seed] Error during seeding:', err);
  }
};

if (require.main === module) {
  connectDB()
    .then(async () => {
      await seedAll();
      await disconnectDB();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seedAll };
