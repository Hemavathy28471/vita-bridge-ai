const express = require('express');
const router = express.Router();
const { getScenarios, triggerSimulation } = require('../controllers/simulationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/scenarios', getScenarios);
router.post('/trigger', triggerSimulation);

module.exports = router;
