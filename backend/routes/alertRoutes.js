const express = require('express');
const router = express.Router();
const { getAlerts, getAlertById, acknowledgeAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getAlerts);
router.get('/:id', getAlertById);
router.put('/:id/read', acknowledgeAlert);

module.exports = router;
