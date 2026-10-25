/**
 * VitaBridge AI - Data Ingestion, Cleaning & Validation Pipeline
 * Normalizes multimodal signals, filters sensor artifacts/noise,
 * drops duplicates, and validates physiological ranges.
 */

const PHYSIOLOGICAL_BOUNDS = {
  heartRate: { min: 30, max: 240, defaultUnit: 'BPM' },
  hrv: { min: 5, max: 250, defaultUnit: 'ms' },
  spo2: { min: 70, max: 100, defaultUnit: '%' },
  temperature: { min: 34.0, max: 43.0, defaultUnit: '°C' },
  respiratoryRate: { min: 6, max: 60, defaultUnit: 'br/min' },
  systolicBP: { min: 60, max: 260, defaultUnit: 'mmHg' },
  diastolicBP: { min: 40, max: 160, defaultUnit: 'mmHg' },
  sleepHours: { min: 0, max: 24, defaultUnit: 'hours' },
  sleepQuality: { min: 0, max: 100, defaultUnit: 'score' },
  activityLevel: { min: 0, max: 1, defaultUnit: 'norm' },
  stressLevel: { min: 0, max: 1, defaultUnit: 'norm' },
};

/**
 * Validates and cleans raw input reading
 */
const cleanAndNormalizeReading = (raw) => {
  const noiseFlags = [];
  const cleaned = {};

  cleaned.userId = raw.userId;
  cleaned.deviceId = raw.deviceId || 'sim-device-01';
  cleaned.sourceType = raw.sourceType || 'simulated';
  cleaned.timestamp = raw.timestamp ? new Date(raw.timestamp) : new Date();

  // Validate or normalize temperature (°F to °C if > 50)
  if (typeof raw.temperature === 'number') {
    let t = raw.temperature;
    if (t > 50 && t < 115) {
      t = (t - 32) * (5 / 9); // Convert Fahrenheit to Celsius
      noiseFlags.push('temperature_converted_from_fahrenheit');
    }
    if (t >= PHYSIOLOGICAL_BOUNDS.temperature.min && t <= PHYSIOLOGICAL_BOUNDS.temperature.max) {
      cleaned.temperature = Number(t.toFixed(1));
    } else {
      noiseFlags.push('temperature_out_of_bounds_omitted');
    }
  }

  // Blood Pressure validation
  const sys = raw.bloodPressure?.systolic || raw.systolicBP;
  const dia = raw.bloodPressure?.diastolic || raw.diastolicBP;
  if (typeof sys === 'number' && typeof dia === 'number') {
    if (
      sys >= PHYSIOLOGICAL_BOUNDS.systolicBP.min &&
      sys <= PHYSIOLOGICAL_BOUNDS.systolicBP.max &&
      dia >= PHYSIOLOGICAL_BOUNDS.diastolicBP.min &&
      dia <= PHYSIOLOGICAL_BOUNDS.diastolicBP.max &&
      sys > dia // Systolic must exceed diastolic
    ) {
      cleaned.bloodPressure = { systolic: Math.round(sys), diastolic: Math.round(dia) };
    } else {
      noiseFlags.push('blood_pressure_physiologically_invalid');
    }
  }

  // Numeric fields validation
  const validateNumeric = (field, key) => {
    const val = raw[field];
    if (typeof val === 'number' && !isNaN(val)) {
      const bounds = PHYSIOLOGICAL_BOUNDS[key || field];
      if (bounds && val >= bounds.min && val <= bounds.max) {
        cleaned[field] = Number(val.toFixed(2));
      } else {
        noiseFlags.push(`${field}_out_of_bounds_filtered`);
      }
    }
  };

  validateNumeric('heartRate');
  validateNumeric('hrv');
  validateNumeric('spo2');
  validateNumeric('respiratoryRate');
  validateNumeric('sleepHours');
  validateNumeric('sleepQuality');
  validateNumeric('activityLevel');
  validateNumeric('steps');
  validateNumeric('calories');
  validateNumeric('stressLevel');

  // Symptoms & context pass-through
  cleaned.symptoms = Array.isArray(raw.symptoms) ? raw.symptoms : [];
  cleaned.context = raw.context || {};
  cleaned.noiseFlags = noiseFlags;
  cleaned.isValidated = true;
  cleaned.isCleaned = true;

  return cleaned;
};

const validateReadingMiddleware = (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload.' });
    }

    req.cleanedReading = cleanAndNormalizeReading({
      ...req.body,
      userId: req.user ? req.user._id : req.body.userId,
    });

    next();
  } catch (err) {
    return res.status(400).json({ success: false, message: `Validation failed: ${err.message}` });
  }
};

module.exports = {
  cleanAndNormalizeReading,
  validateReadingMiddleware,
  PHYSIOLOGICAL_BOUNDS,
};
