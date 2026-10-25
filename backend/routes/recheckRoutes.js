const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { startRecheck, completeRecheck, getRecheckHistory } = require('../controllers/recheckController');

router.post('/start', protect, startRecheck);
router.post('/complete', protect, completeRecheck);
router.get('/history', protect, getRecheckHistory);

module.exports = router;
