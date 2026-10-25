const CameraObservation = require('../models/CameraObservation');
const AudioObservation = require('../models/AudioObservation');
const HealthBaseline = require('../models/HealthBaseline');
const { analyzeVisualFeatures } = require('../services/ai/visualAnalysisService');
const { processAcousticEvent } = require('../services/ai/audioAnalysisService');
const { createAndBroadcastAlert } = require('../services/ai/alertService');
const { assignEarlyWarningTier } = require('../services/ai/riskScoringService');
const { generateExplainableAiSummary } = require('../services/ai/explanationService');

// Ingest Camera Observation
const postCameraObservation = async (req, res) => {
  try {
    const observationData = {
      ...req.body,
      userId: req.user._id,
      timestamp: req.body.timestamp || new Date(),
    };

    const baseline = await HealthBaseline.findOne({ userId: req.user._id });
    const visualResult = analyzeVisualFeatures(observationData, baseline);

    observationData.isUnusualPatternDetected = visualResult.isAnomalous;
    observationData.unusualPatternDetails = visualResult.summary;

    const saved = await CameraObservation.create(observationData);

    // If visual anomaly is acute, recommend recheck
    let alertTriggered = null;
    if (visualResult.isAnomalous && visualResult.fatigueScore >= 60) {
      const tierInfo = assignEarlyWarningTier(visualResult.fatigueScore);
      const explanation = generateExplainableAiSummary({
        tier: tierInfo.tier,
        affectedSignals: visualResult.anomalies.map((a) => ({ name: a.issue, percentChange: 35 })),
      });

      alertTriggered = await createAndBroadcastAlert({
        userId: req.user._id,
        alertLevel: tierInfo.tier,
        title: 'Visual / Fatigue Pattern Alert',
        summary: visualResult.summary,
        earlyWarningScore: visualResult.fatigueScore,
        physiologicalTrendScore: 70,
        recommendedNextAction: 'Perform a 30-second multimodal health recheck.',
        explainableAi: explanation,
      }, req);
    }

    res.status(201).json({
      success: true,
      data: saved,
      analysis: visualResult,
      alert: alertTriggered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Ingest Audio Observation
const postAudioObservation = async (req, res) => {
  try {
    const audioData = {
      ...req.body,
      userId: req.user._id,
      timestamp: req.body.timestamp || new Date(),
    };

    const baseline = await HealthBaseline.findOne({ userId: req.user._id });
    const audioResult = processAcousticEvent(audioData, baseline);

    audioData.isUnusualPatternDetected = audioResult.isAnomalous;
    audioData.interpretation = audioResult.interpretation;

    const saved = await AudioObservation.create(audioData);

    let alertTriggered = null;
    if (audioResult.recommendRecheck) {
      const tierInfo = assignEarlyWarningTier(audioResult.riskScore);
      const explanation = generateExplainableAiSummary({
        tier: tierInfo.tier,
        audioInterpretation: audioResult.interpretation,
        affectedSignals: [{ name: 'Cough-like Acoustic Events', percentChange: 80 }],
      });

      alertTriggered = await createAndBroadcastAlert({
        userId: req.user._id,
        alertLevel: tierInfo.tier,
        title: 'Acoustic Respiratory Event Alert',
        summary: audioResult.interpretation,
        earlyWarningScore: audioResult.riskScore,
        physiologicalTrendScore: 68,
        recommendedNextAction: 'Perform a 30-second breathing and vocal recheck.',
        explainableAi: explanation,
      }, req);
    }

    res.status(201).json({
      success: true,
      data: saved,
      analysis: audioResult,
      alert: alertTriggered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  postCameraObservation,
  postAudioObservation,
};
