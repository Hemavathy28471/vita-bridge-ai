/**
 * VitaBridge AI - Trend Analysis Engine
 * Evaluates chronological multi-day physiological trajectories,
 * detecting subtle gradual shifts, persistent deviations, and signal correlations.
 */

const { calculateMean, evaluateDeviation } = require('./baselineEngine');

/**
 * Analyzes an ordered array of daily/recent readings against baseline
 */
const analyzeTrends = (readings, baseline) => {
  const trends = [];
  if (!readings || readings.length < 2 || !baseline) {
    return trends;
  }

  // Sort ascending by timestamp
  const sorted = [...readings].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const recentDays = sorted.slice(-Math.min(sorted.length, 7));
  const latest = sorted[sorted.length - 1];

  // Helper: Extract valid numeric series
  const getSeries = (key) =>
    recentDays
      .map((r) => (r[key] !== undefined ? r[key] : (r.bloodPressure ? r.bloodPressure[key] : undefined)))
      .filter((v) => typeof v === 'number' && !isNaN(v));

  const hrSeries = getSeries('heartRate');
  const sleepSeries = getSeries('sleepHours');
  const tempSeries = getSeries('temperature');
  const spo2Series = getSeries('spo2');
  const activitySeries = getSeries('activityLevel');
  const hrvSeries = getSeries('hrv');

  // 1. PATTERN A: Heart rate increasing gradually for several days
  if (hrSeries.length >= 3 && baseline.heartRate) {
    let consecutiveIncreases = 0;
    for (let i = 1; i < hrSeries.length; i++) {
      if (hrSeries[i] > hrSeries[i - 1]) consecutiveIncreases++;
    }

    const latestHr = hrSeries[hrSeries.length - 1];
    const initialHr = hrSeries[0];
    const percentChange = ((latestHr - initialHr) / initialHr) * 100;

    if (consecutiveIncreases >= 2 && percentChange >= 8) {
      trends.push({
        category: 'cardiovascular',
        patternType: 'gradual_drift',
        title: 'Gradual Heart Rate Elevation',
        description: `Your resting heart rate has shown an upward trend over the past ${recentDays.length} days (+${percentChange.toFixed(1)}% compared to earlier in the week).`,
        confidenceScore: 0.88,
        signalsInvolved: [
          {
            signalName: 'Heart Rate',
            currentValue: latestHr,
            baselineValue: baseline.heartRate.mean,
            percentChange: Number((((latestHr - baseline.heartRate.mean) / baseline.heartRate.mean) * 100).toFixed(1)),
            direction: 'increasing',
          },
        ],
        durationDays: recentDays.length,
        timeframe: '7d',
        severity: latestHr > baseline.heartRate.mean * 1.2 ? 'moderate' : 'mild',
      });
    }
  }

  // 2. PATTERN B: Sleep decreasing + resting heart rate increasing
  if (sleepSeries.length >= 3 && hrSeries.length >= 3 && baseline.sleepHours && baseline.heartRate) {
    const avgRecentSleep = calculateMean(sleepSeries.slice(-3));
    const avgRecentHr = calculateMean(hrSeries.slice(-3));

    const sleepDropPercent = ((baseline.sleepHours.mean - avgRecentSleep) / baseline.sleepHours.mean) * 100;
    const hrRisePercent = ((avgRecentHr - baseline.heartRate.mean) / baseline.heartRate.mean) * 100;

    if (sleepDropPercent >= 15 && hrRisePercent >= 8) {
      trends.push({
        category: 'recovery',
        patternType: 'multi_signal_discordance',
        title: 'Sleep Deficit with Cardiovascular Strain',
        description: `A coupled pattern was observed: average sleep duration decreased by ${sleepDropPercent.toFixed(1)}% while resting heart rate increased by ${hrRisePercent.toFixed(1)}% over the last 3 days.`,
        confidenceScore: 0.92,
        signalsInvolved: [
          {
            signalName: 'Sleep Duration',
            currentValue: avgRecentSleep,
            baselineValue: baseline.sleepHours.mean,
            percentChange: Number((-sleepDropPercent).toFixed(1)),
            direction: 'decreasing',
          },
          {
            signalName: 'Heart Rate',
            currentValue: avgRecentHr,
            baselineValue: baseline.heartRate.mean,
            percentChange: Number(hrRisePercent.toFixed(1)),
            direction: 'increasing',
          },
        ],
        durationDays: 3,
        timeframe: '7d',
        severity: 'moderate',
      });
    }
  }

  // 3. PATTERN C: SpO2 showing repeated unusual readings
  if (spo2Series.length >= 3 && baseline.spo2) {
    const lowSpo2Readings = spo2Series.filter((v) => v < 95 || v < baseline.spo2.mean - 2.5);
    if (lowSpo2Readings.length >= 2) {
      const minSpo2 = Math.min(...spo2Series);
      trends.push({
        category: 'respiratory',
        patternType: 'repeated_abnormality',
        title: 'Intermittent Oxygen Saturation Dip',
        description: `Multiple readings over recent days recorded oxygen saturation below your personal baseline, dipping to ${minSpo2}%.`,
        confidenceScore: 0.89,
        signalsInvolved: [
          {
            signalName: 'SpO2',
            currentValue: minSpo2,
            baselineValue: baseline.spo2.mean,
            percentChange: Number((((minSpo2 - baseline.spo2.mean) / baseline.spo2.mean) * 100).toFixed(1)),
            direction: 'decreasing',
          },
        ],
        durationDays: recentDays.length,
        timeframe: '7d',
        severity: minSpo2 < 93 ? 'significant' : 'moderate',
      });
    }
  }

  // 4. PATTERN D: Temperature increasing + heart rate increasing
  if (tempSeries.length >= 2 && hrSeries.length >= 2 && baseline.temperature && baseline.heartRate) {
    const latestTemp = tempSeries[tempSeries.length - 1];
    const latestHr = hrSeries[hrSeries.length - 1];
    const tempDev = evaluateDeviation(latestTemp, baseline.temperature);
    const hrDev = evaluateDeviation(latestHr, baseline.heartRate);

    if (tempDev.zScore > 1.5 && hrDev.zScore > 1.5) {
      trends.push({
        category: 'multimodal',
        patternType: 'multi_signal_discordance',
        title: 'Thermal & Heart Rate Co-elevation Pattern',
        description: `Both body temperature (${latestTemp}°C, baseline ${baseline.temperature.mean}°C) and heart rate (${latestHr} BPM, baseline ${baseline.heartRate.mean} BPM) are concurrently elevated.`,
        confidenceScore: 0.94,
        signalsInvolved: [
          {
            signalName: 'Body Temperature',
            currentValue: latestTemp,
            baselineValue: baseline.temperature.mean,
            percentChange: tempDev.percentChange,
            direction: 'increasing',
          },
          {
            signalName: 'Heart Rate',
            currentValue: latestHr,
            baselineValue: baseline.heartRate.mean,
            percentChange: hrDev.percentChange,
            direction: 'increasing',
          },
        ],
        durationDays: 2,
        timeframe: '24h',
        severity: 'significant',
      });
    }
  }

  // 5. PATTERN E: Activity suddenly decreasing compared with user's normal activity
  if (activitySeries.length >= 2 && baseline.activityLevel) {
    const recentActivity = calculateMean(activitySeries.slice(-2));
    const activityDrop = ((baseline.activityLevel.mean - recentActivity) / baseline.activityLevel.mean) * 100;

    if (activityDrop >= 35) {
      trends.push({
        category: 'activity',
        patternType: 'sudden_shift',
        title: 'Acute Activity Level Drop',
        description: `Daily physical activity is markedly lower than your usual pattern (-${activityDrop.toFixed(1)}% compared to normal weekly volume).`,
        confidenceScore: 0.85,
        signalsInvolved: [
          {
            signalName: 'Activity Level',
            currentValue: Number(recentActivity.toFixed(2)),
            baselineValue: baseline.activityLevel.mean,
            percentChange: Number((-activityDrop).toFixed(1)),
            direction: 'decreasing',
          },
        ],
        durationDays: 2,
        timeframe: '7d',
        severity: 'mild',
      });
    }
  }

  // 6. STABLE BASELINE (if no deviations found)
  if (trends.length === 0 && sorted.length >= 3) {
    trends.push({
      category: 'multimodal',
      patternType: 'stable_baseline',
      title: 'Physiological Stability Maintained',
      description: 'Cardiovascular, respiratory, and recovery metrics remain closely aligned within your expected personal baseline ranges.',
      confidenceScore: 0.95,
      signalsInvolved: [],
      durationDays: recentDays.length,
      timeframe: '7d',
      severity: 'normal',
    });
  }

  return trends;
};

module.exports = {
  analyzeTrends,
};
