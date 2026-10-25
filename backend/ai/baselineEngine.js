/**
 * VitaBridge AI - Personalized Health Baseline Engine
 * Computes individual physiological baselines rather than static population thresholds.
 */

// Math helpers
const calculateMean = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
};

const calculateMedian = (values) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateStdDev = (values, mean) => {
  if (values.length < 2) return 0;
  const m = mean !== undefined ? mean : calculateMean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - m, 2), 0) / (values.length - 1);
  return Math.sqrt(variance);
};

const calculatePercentile = (values, percentile) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

/**
 * Calculates statistical baseline metrics for a single metric time-series
 */
const buildMetricBaseline = (series, existingBaseline = null, adaptationFactor = 0.05) => {
  const cleanValues = series.filter((v) => typeof v === 'number' && !isNaN(v));
  if (!cleanValues.length) {
    return existingBaseline || {
      mean: 0,
      median: 0,
      stdDev: 1,
      min: 0,
      max: 0,
      p10: 0,
      p25: 0,
      p75: 0,
      p90: 0,
      movingAverage7d: 0,
      movingStdDev7d: 1,
      sampleCount: 0,
      lastUpdated: new Date(),
    };
  }

  const currentMean = calculateMean(cleanValues);
  const currentMedian = calculateMedian(cleanValues);
  const currentStdDev = Math.max(0.1, calculateStdDev(cleanValues, currentMean));
  const minVal = Math.min(...cleanValues);
  const maxVal = Math.max(...cleanValues);
  const p10 = calculatePercentile(cleanValues, 10);
  const p25 = calculatePercentile(cleanValues, 25);
  const p75 = calculatePercentile(cleanValues, 75);
  const p90 = calculatePercentile(cleanValues, 90);

  // Moving 7-day window (latest 7 samples or proportional)
  const window7d = cleanValues.slice(-Math.min(cleanValues.length, 7));
  const movingAvg7d = calculateMean(window7d);
  const movingStd7d = Math.max(0.1, calculateStdDev(window7d, movingAvg7d));

  // If existing baseline exists, adapt gradually using Exponential Moving Average
  if (existingBaseline && existingBaseline.sampleCount > 5) {
    const alpha = adaptationFactor; // Gradual daily adaptation
    const adaptedMean = existingBaseline.mean * (1 - alpha) + currentMean * alpha;
    const adaptedStdDev = Math.max(0.1, existingBaseline.stdDev * (1 - alpha) + currentStdDev * alpha);

    return {
      mean: Number(adaptedMean.toFixed(2)),
      median: Number(currentMedian.toFixed(2)),
      stdDev: Number(adaptedStdDev.toFixed(2)),
      min: Number(minVal.toFixed(2)),
      max: Number(maxVal.toFixed(2)),
      p10: Number(p10.toFixed(2)),
      p25: Number(p25.toFixed(2)),
      p75: Number(p75.toFixed(2)),
      p90: Number(p90.toFixed(2)),
      movingAverage7d: Number(movingAvg7d.toFixed(2)),
      movingStdDev7d: Number(movingStd7d.toFixed(2)),
      sampleCount: existingBaseline.sampleCount + cleanValues.length,
      lastUpdated: new Date(),
    };
  }

  return {
    mean: Number(currentMean.toFixed(2)),
    median: Number(currentMedian.toFixed(2)),
    stdDev: Number(currentStdDev.toFixed(2)),
    min: Number(minVal.toFixed(2)),
    max: Number(maxVal.toFixed(2)),
    p10: Number(p10.toFixed(2)),
    p25: Number(p25.toFixed(2)),
    p75: Number(p75.toFixed(2)),
    p90: Number(p90.toFixed(2)),
    movingAverage7d: Number(movingAvg7d.toFixed(2)),
    movingStdDev7d: Number(movingStd7d.toFixed(2)),
    sampleCount: cleanValues.length,
    lastUpdated: new Date(),
  };
};

/**
 * Calculates deviations of a single reading compared to personalized baseline
 */
const evaluateDeviation = (currentValue, baselineMetric) => {
  if (!baselineMetric || typeof currentValue !== 'number' || isNaN(currentValue)) {
    return { percentChange: 0, zScore: 0, direction: 'stable', isAbnormal: false };
  }

  const { mean, stdDev } = baselineMetric;
  const safeStdDev = Math.max(0.1, stdDev || 1);
  const zScore = (currentValue - mean) / safeStdDev;
  const percentChange = mean !== 0 ? ((currentValue - mean) / mean) * 100 : 0;

  let direction = 'stable';
  if (percentChange > 3) direction = 'increasing';
  else if (percentChange < -3) direction = 'decreasing';

  // Abnormal if absolute z-score exceeds 2.0 (standard statistical definition: outside ~95% personal range)
  const isAbnormal = Math.abs(zScore) >= 2.0;

  return {
    currentValue: Number(currentValue.toFixed(2)),
    baselineMean: Number(mean.toFixed(2)),
    percentChange: Number(percentChange.toFixed(1)),
    zScore: Number(zScore.toFixed(2)),
    direction,
    isAbnormal,
  };
};

module.exports = {
  buildMetricBaseline,
  evaluateDeviation,
  calculateMean,
  calculateMedian,
  calculateStdDev,
  calculatePercentile,
};
