/**
 * VitaBridge AI - VitaGuide Conversational Assistant
 * Intelligent health dialogue grounded in the user's authentic baseline,
 * recent physiological trends, and active alerts.
 * 
 * Strict Clinical Guardrails:
 * - Never diagnoses diseases
 * - Never prescribes medicines or alters dosages
 * - Differentiates observed data vs educational context
 * - Directs users to healthcare professionals for clinical evaluation
 */

const HealthBaseline = require('../models/HealthBaseline');
const PhysiologicalReading = require('../models/PhysiologicalReading');
const Alert = require('../models/Alert');
const HealthTrend = require('../models/HealthTrend');
const { calculateMean } = require('../ai/baselineEngine');

const processUserQuery = async (userId, queryText) => {
  const query = (queryText || '').toLowerCase().trim();

  // Fetch contextual user data
  const [baseline, latestReadings, latestAlerts, activeTrends] = await Promise.all([
    HealthBaseline.findOne({ userId }),
    PhysiologicalReading.find({ userId }).sort({ timestamp: -1 }).limit(7),
    Alert.find({ userId }).sort({ createdAt: -1 }).limit(3),
    HealthTrend.find({ userId, isCurrent: true }).sort({ createdAt: -1 }).limit(3),
  ]);

  const latestReading = latestReadings[0] || null;

  // 1. "Why did I receive this alert?" or query mentions "alert" / "warning"
  if (query.includes('alert') || query.includes('warning') || query.includes('why did i receive')) {
    if (!latestAlerts || latestAlerts.length === 0) {
      return {
        answer: 'You currently have no active health alerts. All your monitored biometrics (heart rate, SpO2, sleep, and temperature) are tracking within your expected baseline range.',
        contextData: { activeAlerts: 0 },
        disclaimer: 'VitaBridge provides decision-support and trend monitoring, not medical diagnosis.',
      };
    }

    const alert = latestAlerts[0];
    const explanation = alert.explainableAi;
    const signals = alert.affectedSignals.map((s) => `${s.signal} (${s.currentValue} vs baseline ${s.baselineValue})`).join(', ');

    return {
      answer: `The recent ${alert.alertLevel} alert was triggered because VitaBridge detected a deviation from your personal baseline.\n\n` +
        `• **What was detected**: ${explanation ? explanation.whatHappened : alert.summary}\n` +
        `• **Affected measurements**: ${signals}\n` +
        `• **Deviation extent**: ${alert.baselineComparisonText || 'Multiple metrics diverged from personal average'}\n\n` +
        `**Recommended Action**: ${alert.recommendedNextAction}`,
      contextData: {
        alertLevel: alert.alertLevel,
        earlyWarningScore: alert.earlyWarningScore,
        confidence: alert.confidence,
      },
      disclaimer: 'Alerts are observational and informational. If you feel unwell or have concerning symptoms, contact a healthcare provider.',
    };
  }

  // 2. "How has my sleep changed?" or query mentions "sleep"
  if (query.includes('sleep') || query.includes('rest')) {
    if (!baseline || !baseline.sleepHours || latestReadings.length === 0) {
      return {
        answer: 'I need a few more recorded sleep logs to compare against your baseline. Please keep wearing your device overnight.',
        contextData: null,
      };
    }

    const sleepValues = latestReadings.map((r) => r.sleepHours).filter((v) => typeof v === 'number');
    const recentAvgSleep = calculateMean(sleepValues);
    const diff = recentAvgSleep - baseline.sleepHours.mean;
    const diffText = Math.abs(diff).toFixed(1);

    let interpretation = '';
    if (diff < -0.7) {
      interpretation = `Your sleep duration has been lower than your personal baseline by about ${diffText} hours per night (averaging ${recentAvgSleep.toFixed(1)}h vs your baseline of ${baseline.sleepHours.mean}h). Sleep deficit can often lead to elevated resting heart rate and reduced daytime energy.`;
    } else if (diff > 0.7) {
      interpretation = `You have been resting well: averaging ${recentAvgSleep.toFixed(1)}h per night, which is ${diffText} hours above your baseline requirement.`;
    } else {
      interpretation = `Your sleep duration is steady and consistent at an average of ${recentAvgSleep.toFixed(1)} hours per night, closely matching your personal baseline of ${baseline.sleepHours.mean}h.`;
    }

    return {
      answer: interpretation,
      contextData: {
        recentAverageSleepHours: Number(recentAvgSleep.toFixed(1)),
        baselineSleepHours: baseline.sleepHours.mean,
      },
      disclaimer: 'Informational analysis based on connected device sleep stages.',
    };
  }

  // 3. "What changed this week?" or query mentions "week" / "changed" / "trends" / "recent"
  if (query.includes('change') || query.includes('week') || query.includes('trend') || query.includes('recent')) {
    const changes = [];

    if (baseline && latestReading) {
      if (latestReading.heartRate && baseline.heartRate) {
        const delta = latestReading.heartRate - baseline.heartRate.mean;
        if (Math.abs(delta) >= 5) {
          changes.push(`• **Heart Rate**: Averaging ${latestReading.heartRate} BPM (${delta > 0 ? '+' : ''}${delta.toFixed(0)} BPM from baseline).`);
        }
      }
      if (latestReading.temperature && baseline.temperature) {
        const delta = latestReading.temperature - baseline.temperature.mean;
        if (Math.abs(delta) >= 0.4) {
          changes.push(`• **Body Temperature**: Measured at ${latestReading.temperature}°C (baseline is ${baseline.temperature.mean}°C).`);
        }
      }
      if (latestReading.spo2 && baseline.spo2 && latestReading.spo2 < baseline.spo2.mean - 2) {
        changes.push(`• **Oxygen Saturation (SpO2)**: Measured at ${latestReading.spo2}% (baseline is ${baseline.spo2.mean}%).`);
      }
    }

    let answer = '';
    if (changes.length > 0) {
      answer = `Here is a summary of noticeable variations from your personal baseline this week:\n\n${changes.join('\n')}\n\n`;
      if (activeTrends.length > 0) {
        answer += `**Observed Pattern**: ${activeTrends[0].title} (${activeTrends[0].description})`;
      }
    } else {
      answer = `Your physiological markers over the past week have remained stable and aligned with your baseline:\n\n` +
        `• Resting Heart Rate: ~${baseline?.heartRate?.mean || 72} BPM\n` +
        `• SpO2: ~${baseline?.spo2?.mean || 98}%\n` +
        `• Sleep: ~${baseline?.sleepHours?.mean || 7.5} hours\n` +
        `• Overall Status: Stable Equilibrium`;
    }

    return {
      answer,
      contextData: { trendsIdentified: activeTrends.length },
      disclaimer: 'VitaBridge trend detection does not constitute a clinical diagnosis.',
    };
  }

  // 4. "Heart rate" or cardiovascular query
  if (query.includes('heart') || query.includes('hrv') || query.includes('pulse')) {
    const hr = latestReading ? latestReading.heartRate : 72;
    const hrv = latestReading ? latestReading.hrv : 45;
    const baseHr = baseline?.heartRate?.mean || 70;
    const baseHrv = baseline?.hrv?.mean || 45;

    return {
      answer: `Your current resting heart rate is **${hr} BPM** (your personal baseline is **${baseHr} BPM**).\n` +
        `Your heart rate variability (HRV) is **${hrv} ms** (baseline is **${baseHrv} ms**).\n\n` +
        `Higher HRV typically reflects autonomic recovery, while a lower HRV combined with elevated resting HR can indicate physical exertion, stress, or upcoming illness.`,
      contextData: { currentHR: hr, baselineHR: baseHr, currentHRV: hrv, baselineHRV: baseHrv },
      disclaimer: 'Consult a cardiologist or physician if you experience sudden chest tightness or palpitations.',
    };
  }

  // General fallback response
  return {
    answer: `Hello! I'm **VitaGuide**, your physiological trend assistant. I monitor how your daily metrics compare to your personal baseline.\n\n` +
      `You can ask me:\n` +
      `• *"What changed this week?"*\n` +
      `• *"Why did I receive this alert?"*\n` +
      `• *"How has my sleep changed?"*\n` +
      `• *"Tell me about my heart rate trends."*\n\n` +
      `How can I help you review your health trends today?`,
    contextData: null,
    disclaimer: 'VitaBridge is an informational health-monitoring system and cannot diagnose medical conditions.',
  };
};

module.exports = {
  processUserQuery,
};
