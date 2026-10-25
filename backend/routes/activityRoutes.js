const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getActivityStatus, postActivityContext } = require('../controllers/activityController');

router.get('/', protect, getActivityStatus);
router.post('/context', protect, postActivityContext);

module.exports = router;
