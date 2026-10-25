/**
 * baselineService.js
 * Calculates and dynamically adapts personal baselines:
 * Mean, Median, Moving Average, Standard Deviation, Percentiles (P10, P25, P75, P90),
 * percent change, and trend direction.
 */

function computeMetricStatistics(values = []) {
  if (!values || values.length === 0) {
    return {
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
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const variance = sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n > 1 ? n - 1 : 1);
  const stdDev = Math.sqrt(variance) || 1;

  const getPercentile = (p) => {
    const idx = (p / 100) * (n - 1);
    const lower = Math.floor(idx);
    const fraction = idx - lower;
    if (lower >= n - 1) return sorted[n - 1];
    return sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower]);
  };

  const recentWindow = sorted.slice(-Math.min(7, n));
  const recentSum = recentWindow.reduce((a, b) => a + b, 0);
  const movingAvg7d = recentSum / recentWindow.length;

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    min: sorted[0],
    max: sorted[n - 1],
    p10: Number(getPercentile(10).toFixed(2)),
    p25: Number(getPercentile(25).toFixed(2)),
    p75: Number(getPercentile(75).toFixed(2)),
    p90: Number(getPercentile(90).toFixed(2)),
    movingAverage7d: Number(movingAvg7d.toFixed(2)),
    sampleCount: n,
    lastUpdated: new Date(),
  };
}

/**
 * Adapt baseline using Exponential Moving Average
 */
function updateBaselineWithNewReading(existingBaselineMetric, newValue, alpha = 0.05) {
  if (!existingBaselineMetric || !existingBaselineMetric.mean) {
    return computeMetricStatistics([newValue]);
  }

  const updatedMean = (1 - alpha) * existingBaselineMetric.mean + alpha * newValue;
  const diff = Math.abs(newValue - updatedMean);
  const updatedStdDev = (1 - alpha) * (existingBaselineMetric.stdDev || 2) + alpha * diff;

  return {
    ...existingBaselineMetric,
    mean: Number(updatedMean.toFixed(2)),
    stdDev: Number(Math.max(0.5, updatedStdDev).toFixed(2)),
    movingAverage7d: Number(updatedMean.toFixed(2)),
    sampleCount: (existingBaselineMetric.sampleCount || 0) + 1,
    lastUpdated: new Date(),
  };
}

module.exports = {
  computeMetricStatistics,
  updateBaselineWithNewReading,
};
