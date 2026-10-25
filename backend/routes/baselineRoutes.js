const express = require('express');
const router = express.Router();
const { getBaseline, recalibrateBaseline } = require('../controllers/baselineController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getBaseline);
router.post('/recalibrate', recalibrateBaseline);

module.exports = router;
