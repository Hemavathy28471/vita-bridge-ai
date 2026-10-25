const { SCENARIOS, runSimulationScenario } = require('../services/simulationService');
const { logAuditEvent } = require('../middleware/audit');

// List available scenarios
const getScenarios = (req, res) => {
  const list = Object.entries(SCENARIOS).map(([key, item]) => ({
    key,
    name: item.name,
    description: item.description,
  }));

  res.json({
    success: true,
    data: list,
  });
};

// Trigger simulation scenario
const triggerSimulation = async (req, res) => {
  try {
    const { scenarioKey = 'NORMAL_DAY' } = req.body;
    const targetUserId = req.user._id;

    const result = await runSimulationScenario(targetUserId, scenarioKey, req.user);

    await logAuditEvent({
      actorId: req.user._id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'SIMULATION_TRIGGERED',
      resourceType: 'SYSTEM',
      details: { scenarioKey, alertLevel: result.alertLevel },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Scenario '${result.scenarioName}' executed successfully.`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getScenarios,
  triggerSimulation,
};
