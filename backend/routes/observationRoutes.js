const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { postCameraObservation, postAudioObservation } = require('../controllers/observationController');

router.post('/camera-observations', protect, postCameraObservation);
router.post('/audio-observations', protect, postAudioObservation);

module.exports = router;
