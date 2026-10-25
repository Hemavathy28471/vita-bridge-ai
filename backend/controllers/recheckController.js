const RecheckSession = require('../models/RecheckSession');
const HealthBaseline = require('../models/HealthBaseline');
const { verifyRecheckSession } = require('../services/ai/recheckService');
const { fuseMultimodalSignals } = require('../services/ai/multimodalFusionService');
const { assignEarlyWarningTier } = require('../services/ai/riskScoringService');
const { generateExplainableAiSummary } = require('../services/ai/explanationService');
const { createAndBroadcastAlert } = require('../services/ai/alertService');

// Start Recheck Session
const startRecheck = async (req, res) => {
  try {
    const { protocolType = 'general', triggerSource = 'manual', initialSignals = {} } = req.body;

    const session = await RecheckSession.create({
      userId: req.user._id,
      protocolType,
      triggerSource,
      status: 'in_progress',
      startedAt: new Date(),
      durationSeconds: 30,
      initialSignals,
    });

    res.status(201).json({
      success: true,
      message: `30-second ${protocolType} recheck session started.`,
      data: session,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Complete Recheck Session
const completeRecheck = async (req, res) => {
  try {
    const {
      sessionId,
      recheckSignals = {},
      userSymptomInput = {},
    } = req.body;

    let session = null;
    if (sessionId) {
      session = await RecheckSession.findOne({ _id: sessionId, userId: req.user._id });
    }

    const baseline = await HealthBaseline.findOne({ userId: req.user._id });
    const protocol = session ? session.protocolType : (req.body.protocolType || 'general');
    const initialSignals = session ? session.initialSignals : (req.body.initialSignals || {});

    // Verify persistence using Recheck Engine
    const verification = verifyRecheckSession(protocol, initialSignals, recheckSignals, baseline);

    // Multimodal signal fusion
    const fusion = fuseMultimodalSignals({
      physiologicalResult: {
        hasDeviations: verification.persists,
        deviationScore: verification.persists ? 65 : 15,
        deviations: verification.persistingSignals.map((p) => ({ name: p.signal, percentChange: 20 })),
      },
      userSymptoms: userSymptomInput,
      recheckPersistence: verification.persists,
    });

    // Assign Early Warning Tier (GREEN, YELLOW, ORANGE, RED)
    const tierInfo = assignEarlyWarningTier(fusion.earlyWarningScore);

    // Generate Explainable AI summary (Why? What does this mean? What should I do?)
    const explanation = generateExplainableAiSummary({
      tier: tierInfo.tier,
      affectedSignals: verification.persistingSignals.map((p) => ({ name: p.signal, percentChange: 25 })),
    });

    const fusionOutcome = {
      earlyWarningScore: fusion.earlyWarningScore,
      physiologicalTrendScore: fusion.physiologicalTrendScore,
      assignedAlertTier: tierInfo.tier,
      confidence: 0.91,
      explainableSummary: explanation,
      recommendedNextAction: tierInfo.message,
    };

    if (session) {
      session.status = 'completed';
      session.completedAt = new Date();
      session.recheckSignals = recheckSignals;
      session.userSymptomInput = userSymptomInput;
      session.comparisonResult = {
        persists: verification.persists,
        consistencyScore: verification.consistencyScore,
        interpretation: verification.summary,
      };
      session.multimodalFusionOutcome = fusionOutcome;
      await session.save();
    } else {
      session = await RecheckSession.create({
        userId: req.user._id,
        protocolType: protocol,
        triggerSource: req.body.triggerSource || 'manual',
        status: 'completed',
        startedAt: new Date(Date.now() - 30000),
        completedAt: new Date(),
        durationSeconds: 30,
        initialSignals,
        recheckSignals,
        userSymptomInput,
        comparisonResult: {
          persists: verification.persists,
          consistencyScore: verification.consistencyScore,
          interpretation: verification.summary,
        },
        multimodalFusionOutcome: fusionOutcome,
      });
    }

    // If persisting deviation is detected, trigger or update alert
    let alertTriggered = null;
    if (verification.persists || tierInfo.tier !== 'GREEN') {
      alertTriggered = await createAndBroadcastAlert({
        userId: req.user._id,
        alertLevel: tierInfo.tier,
        title: `${protocol.toUpperCase()} Recheck: ${tierInfo.label} Alert`,
        summary: verification.summary,
        earlyWarningScore: fusion.earlyWarningScore,
        physiologicalTrendScore: fusion.physiologicalTrendScore,
        recommendedNextAction: tierInfo.message,
        explainableAi: explanation,
      }, req);
    }

    res.json({
      success: true,
      data: session,
      verification,
      tier: tierInfo,
      explanation,
      alert: alertTriggered,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get recent recheck sessions
const getRecheckHistory = async (req, res) => {
  try {
    const sessions = await RecheckSession.find({ userId: req.user._id })
      .sort({ startedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  startRecheck,
  completeRecheck,
  getRecheckHistory,
};
