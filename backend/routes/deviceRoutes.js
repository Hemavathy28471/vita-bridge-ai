const express = require('express');
const router = express.Router();
const { getDevices, addDevice, toggleDeviceStatus } = require('../controllers/deviceController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getDevices);
router.post('/', addDevice);
router.put('/:id/toggle', toggleDeviceStatus);

module.exports = router;
